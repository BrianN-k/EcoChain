const express = require('express');
const prisma = require('../config/prisma');
const env = require('../config/env');
const { asyncHandler, HttpError } = require('../utils/errors');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  rejectSchema,
  approveSchema,
  recordRewardSchema,
  ratesSchema,
  citizenStatusSchema,
} = require('../utils/validators');
const { CATEGORIES, STATUS, VERIFIED_STATUSES } = require('../config/constants');
const { getRates, saveRates } = require('../services/settings');
const { expectedFor, settleReward } = require('../services/rewards');
const { categoryBreakdown, monthlySeries, round } = require('../services/stats');

const router = express.Router();
// Every route below needs a valid login AND the ADMIN role (checked on the server every time).
router.use(requireAuth, requireRole('ADMIN'));

const audit = (actorId, action, entityType, entityId, details) =>
  prisma.auditLog.create({
    data: { actorId, action, entityType, entityId, details: details ? JSON.stringify(details) : null },
  });

function shapeSubmission(s, rates) {
  return {
    id: s.id,
    wasteCategory: s.wasteCategory,
    quantityKg: s.quantityKg,
    collectionLocation: s.collectionLocation,
    recyclingDate: s.recyclingDate,
    createdAt: s.createdAt,
    status: s.status,
    rejectionReason: s.rejectionReason,
    evidenceUrl: s.evidenceImagePath ? `/api/evidence/${s.evidenceImagePath}` : null,
    citizen: s.citizen
      ? {
          id: s.citizen.id,
          fullName: s.citizen.fullName,
          email: s.citizen.email,
          walletAddress: s.citizen.walletAddress,
        }
      : undefined,
    verification: s.verification || null,
    reward: s.reward || null,
    estimatedTokens: rates ? Math.round(s.quantityKg * 1000 * rates[s.wasteCategory]) / 1000 : undefined,
  };
}

// ---------------- Submissions -------------------------------------------------

router.get(
  '/submissions',
  asyncHandler(async (req, res) => {
    const rates = await getRates();
    const where = req.query.status ? { status: String(req.query.status) } : {};
    const rows = await prisma.recyclingSubmission.findMany({
      where,
      include: { citizen: true, verification: true, reward: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ submissions: rows.map((s) => shapeSubmission(s, rates)) });
  })
);

router.get(
  '/submissions/:id',
  asyncHandler(async (req, res) => {
    const rates = await getRates();
    const s = await prisma.recyclingSubmission.findUnique({
      where: { id: req.params.id },
      include: { citizen: true, verification: { include: { admin: true } }, reward: true },
    });
    if (!s) throw new HttpError(404, 'Submission not found');
    const history = await prisma.recyclingSubmission.count({
      where: { citizenId: s.citizenId, status: { in: VERIFIED_STATUSES } },
    });
    res.json({ submission: shapeSubmission(s, rates), citizenVerifiedCount: history });
  })
);

// Approve: only a PENDING submission can be approved, and the update is guarded
// so two admins clicking at the same time cannot both succeed.
router.post(
  '/submissions/:id/approve',
  validate(approveSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    await prisma.$transaction(async (tx) => {
      const changed = await tx.recyclingSubmission.updateMany({
        where: { id, status: STATUS.PENDING },
        data: { status: STATUS.APPROVED, rejectionReason: null },
      });
      if (changed.count !== 1) throw new HttpError(409, 'Only pending submissions can be approved');
      await tx.verification.create({
        data: { submissionId: id, adminId: req.user.id, decision: 'APPROVED', comments: req.body.comments || null },
      });
      const s = await tx.recyclingSubmission.findUnique({ where: { id } });
      await tx.notification.create({
        data: {
          userId: s.citizenId,
          title: 'Recycling approved',
          message: `Your ${s.wasteCategory.toLowerCase()} submission (${s.quantityKg} kg) was approved. Your ECO reward is being prepared.`,
        },
      });
    });
    await audit(req.user.id, 'APPROVE_SUBMISSION', 'RecyclingSubmission', id);
    res.json({ message: 'Submission approved' });
  })
);

router.post(
  '/submissions/:id/reject',
  validate(rejectSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    await prisma.$transaction(async (tx) => {
      const changed = await tx.recyclingSubmission.updateMany({
        where: { id, status: STATUS.PENDING },
        data: { status: STATUS.REJECTED, rejectionReason: req.body.reason },
      });
      if (changed.count !== 1) throw new HttpError(409, 'Only pending submissions can be rejected');
      await tx.verification.create({
        data: { submissionId: id, adminId: req.user.id, decision: 'REJECTED', comments: req.body.reason },
      });
      const s = await tx.recyclingSubmission.findUnique({ where: { id } });
      await tx.notification.create({
        data: {
          userId: s.citizenId,
          title: 'Recycling rejected',
          message: `Your ${s.wasteCategory.toLowerCase()} submission was rejected: ${req.body.reason}`,
        },
      });
    });
    await audit(req.user.id, 'REJECT_SUBMISSION', 'RecyclingSubmission', id, { reason: req.body.reason });
    res.json({ message: 'Submission rejected' });
  })
);

// ---------------- Rewards -----------------------------------------------------

// What the admin's browser needs to build the contract call.
router.get(
  '/submissions/:id/reward-params',
  asyncHandler(async (req, res) => {
    const s = await prisma.recyclingSubmission.findUnique({
      where: { id: req.params.id },
      include: { citizen: true, reward: true },
    });
    if (!s) throw new HttpError(404, 'Submission not found');
    if (!s.citizen.walletAddress) throw new HttpError(409, 'The citizen has not linked a wallet yet');
    const e = await expectedFor(s, s.citizen.walletAddress);
    res.json({
      submissionId: s.id,
      onchainId: e.onchainId,
      citizen: e.citizen,
      categoryIndex: e.categoryIndex,
      grams: e.grams,
      estimatedTokens: e.estimatedTokens,
      status: s.status,
      reward: s.reward,
    });
  })
);

// The admin signed the contract call in MetaMask and sends us the transaction hash.
// We store it as PROCESSING, then verify it on the blockchain ourselves.
router.post(
  '/rewards',
  validate(recordRewardSchema),
  asyncHandler(async (req, res) => {
    const { submissionId, transactionHash } = req.body;
    const hash = transactionHash.toLowerCase();

    const s = await prisma.recyclingSubmission.findUnique({
      where: { id: submissionId },
      include: { citizen: true, reward: true },
    });
    if (!s) throw new HttpError(404, 'Submission not found');
    if (!s.citizen.walletAddress) throw new HttpError(409, 'The citizen has not linked a wallet yet');

    const existing = s.reward;
    if (existing && existing.transactionStatus !== 'FAILED') {
      throw new HttpError(409, 'A reward already exists for this submission');
    }
    if (!existing && s.status !== STATUS.APPROVED) {
      throw new HttpError(409, 'Only approved submissions can be rewarded');
    }

    const expected = await expectedFor(s, s.citizen.walletAddress);

    const reward = await prisma.$transaction(async (tx) => {
      let r;
      if (existing) {
        // Retry after a failed attempt: the guard makes sure only one retry wins.
        const changed = await tx.reward.updateMany({
          where: { id: existing.id, transactionStatus: 'FAILED' },
          data: { transactionHash: hash, transactionStatus: 'PROCESSING', failureReason: null },
        });
        if (changed.count !== 1) throw new HttpError(409, 'A reward already exists for this submission');
        r = await tx.reward.findUnique({ where: { id: existing.id } });
      } else {
        // submissionId is UNIQUE in the database, so a second insert throws (P2002 -> 409).
        r = await tx.reward.create({
          data: {
            citizenId: s.citizenId,
            submissionId: s.id,
            tokenAmount: expected.estimatedTokens,
            transactionHash: hash,
            transactionStatus: 'PROCESSING',
          },
        });
      }
      await tx.recyclingSubmission.update({ where: { id: s.id }, data: { status: STATUS.REWARD_PROCESSING } });
      return r;
    });

    await audit(req.user.id, 'RECORD_REWARD_TX', 'Reward', reward.id, { transactionHash: hash });
    // Try to settle straight away (works if the transaction is already mined).
    const settled = await settleReward(reward.id);
    res.status(201).json({ reward: settled });
  })
);

// Re-check a processing reward against the blockchain.
router.post(
  '/rewards/:id/refresh',
  asyncHandler(async (req, res) => {
    const reward = await settleReward(req.params.id);
    if (!reward) throw new HttpError(404, 'Reward not found');
    res.json({ reward });
  })
);

// ---------------- Citizens ------------------------------------------------------

router.get(
  '/citizens',
  asyncHandler(async (req, res) => {
    const [users, subs, rewards] = await Promise.all([
      prisma.user.findMany({ where: { role: 'CITIZEN' }, orderBy: { createdAt: 'desc' } }),
      prisma.recyclingSubmission.groupBy({
        by: ['citizenId'],
        where: { status: { in: VERIFIED_STATUSES } },
        _sum: { quantityKg: true },
        _count: { _all: true },
      }),
      prisma.reward.groupBy({
        by: ['citizenId'],
        where: { transactionStatus: 'CONFIRMED' },
        _sum: { tokenAmount: true },
      }),
    ]);
    const subBy = new Map(subs.map((r) => [r.citizenId, r]));
    const rewBy = new Map(rewards.map((r) => [r.citizenId, r._sum.tokenAmount || 0]));
    res.json({
      citizens: users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        walletAddress: u.walletAddress,
        accountStatus: u.accountStatus,
        isDemo: u.isDemo,
        createdAt: u.createdAt,
        verifiedSubmissions: subBy.get(u.id)?._count._all || 0,
        verifiedKg: round(subBy.get(u.id)?._sum.quantityKg || 0, 3),
        tokensEarned: round(rewBy.get(u.id) || 0, 3),
      })),
    });
  })
);

router.patch(
  '/citizens/:id/status',
  validate(citizenStatusSchema),
  asyncHandler(async (req, res) => {
    const u = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!u || u.role !== 'CITIZEN') throw new HttpError(404, 'Citizen not found');
    await prisma.user.update({ where: { id: u.id }, data: { accountStatus: req.body.accountStatus } });
    await audit(req.user.id, 'SET_ACCOUNT_STATUS', 'User', u.id, { status: req.body.accountStatus });
    res.json({ message: 'Account updated' });
  })
);

// ---------------- Tokens and blockchain records -----------------------------------

router.get(
  '/rewards',
  asyncHandler(async (req, res) => {
    const rows = await prisma.reward.findMany({
      include: { citizen: true, submission: true },
      orderBy: { createdAt: 'desc' },
    });
    const sum = (status) =>
      rows.filter((r) => r.transactionStatus === status).reduce((a, r) => a + r.tokenAmount, 0);
    res.json({
      explorerBaseUrl: env.EXPLORER_BASE_URL,
      summary: {
        totalDistributed: round(sum('CONFIRMED'), 3),
        confirmed: rows.filter((r) => r.transactionStatus === 'CONFIRMED').length,
        pending: rows.filter((r) => r.transactionStatus === 'PROCESSING').length,
        failed: rows.filter((r) => r.transactionStatus === 'FAILED').length,
      },
      rewards: rows.map((r) => ({
        id: r.id,
        submissionId: r.submissionId,
        citizenName: r.citizen.fullName,
        walletAddress: r.citizen.walletAddress,
        tokenAmount: r.tokenAmount,
        transactionHash: r.transactionHash,
        transactionStatus: r.transactionStatus,
        failureReason: r.failureReason,
        createdAt: r.createdAt,
        wasteCategory: r.submission.wasteCategory,
      })),
    });
  })
);

// ---------------- Overview and reports ------------------------------------------------

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const [citizens, subs, rewards, recentCitizens] = await Promise.all([
      prisma.user.count({ where: { role: 'CITIZEN' } }),
      prisma.recyclingSubmission.findMany({ include: { citizen: true }, orderBy: { createdAt: 'desc' } }),
      prisma.reward.findMany({ include: { citizen: true }, orderBy: { createdAt: 'desc' } }),
      prisma.user.findMany({ where: { role: 'CITIZEN' }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);
    const verified = subs.filter((s) => VERIFIED_STATUSES.includes(s.status));
    res.json({
      stats: {
        citizens,
        submissions: subs.length,
        pending: subs.filter((s) => s.status === 'PENDING').length,
        approved: verified.length,
        verifiedKg: round(verified.reduce((a, s) => a + s.quantityKg, 0), 3),
        tokensDistributed: round(
          rewards.filter((r) => r.transactionStatus === 'CONFIRMED').reduce((a, r) => a + r.tokenAmount, 0),
          3
        ),
      },
      monthly: monthlySeries(subs, 6),
      categories: categoryBreakdown(subs),
      recentCitizens: recentCitizens.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        createdAt: u.createdAt,
        isDemo: u.isDemo,
      })),
      recentSubmissions: subs.slice(0, 6).map((s) => shapeSubmission(s)),
      pendingQueue: subs.filter((s) => s.status === 'PENDING').slice(0, 6).map((s) => shapeSubmission(s)),
      recentRewards: rewards.slice(0, 5).map((r) => ({
        id: r.id,
        citizenName: r.citizen.fullName,
        tokenAmount: r.tokenAmount,
        transactionHash: r.transactionHash,
        transactionStatus: r.transactionStatus,
        createdAt: r.createdAt,
      })),
      explorerBaseUrl: env.EXPLORER_BASE_URL,
    });
  })
);

router.get(
  '/reports',
  asyncHandler(async (req, res) => {
    const [subs, rewards, citizens] = await Promise.all([
      prisma.recyclingSubmission.findMany(),
      prisma.reward.findMany(),
      prisma.user.count({ where: { role: 'CITIZEN' } }),
    ]);
    const verified = subs.filter((s) => VERIFIED_STATUSES.includes(s.status));
    const participants = new Set(subs.map((s) => s.citizenId)).size;
    const confirmed = rewards.filter((r) => r.transactionStatus === 'CONFIRMED');
    const monthly = monthlySeries(subs, 12).map((m) => ({
      ...m,
      tokens: round(
        confirmed
          .filter((r) => {
            const d = new Date(r.createdAt);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === m.month;
          })
          .reduce((a, r) => a + r.tokenAmount, 0),
        3
      ),
    }));
    res.json({
      totals: {
        verifiedKg: round(verified.reduce((a, s) => a + s.quantityKg, 0), 3),
        approved: verified.length,
        rejected: subs.filter((s) => s.status === 'REJECTED').length,
        pending: subs.filter((s) => s.status === 'PENDING').length,
        tokensDistributed: round(confirmed.reduce((a, r) => a + r.tokenAmount, 0), 3),
        citizens,
        participants,
        participationRate: citizens ? round((participants / citizens) * 100, 1) : 0,
      },
      categories: categoryBreakdown(subs),
      monthly,
    });
  })
);

// ---------------- Settings -------------------------------------------------------------

router.get(
  '/settings',
  asyncHandler(async (req, res) => {
    res.json({
      rates: await getRates(),
      categories: CATEGORIES,
      contractAddress: env.CONTRACT_ADDRESS || null,
      chainId: env.CHAIN_ID,
      rpcConfigured: Boolean(env.SEPOLIA_RPC_URL),
    });
  })
);

// Updates the DATABASE rates (used for estimates). The contract owner must also call
// setRate() on the contract in MetaMask; the Settings page shows how.
router.put(
  '/settings/rates',
  validate(ratesSchema),
  asyncHandler(async (req, res) => {
    await saveRates(req.body);
    await audit(req.user.id, 'UPDATE_RATES', 'Setting', 'rates', req.body);
    res.json({ rates: req.body });
  })
);

module.exports = router;
