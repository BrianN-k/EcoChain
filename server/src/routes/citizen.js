const express = require('express');
const prisma = require('../config/prisma');
const { asyncHandler, HttpError } = require('../utils/errors');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload, verifyImage } = require('../middleware/upload');
const { submissionSchema } = require('../utils/validators');
const { VERIFIED_STATUSES } = require('../config/constants');
const { getRates } = require('../services/settings');
const { buildLeaderboard, categoryBreakdown, monthlySeries, round } = require('../services/stats');
const { estimateTokens } = require('../utils/rewards');
const env = require('../config/env');

const router = express.Router();
router.use(requireAuth, requireRole('CITIZEN'));

// Public-facing shape (adds the evidence URL, hides the file path on disk).
function shape(s) {
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
    reward: s.reward
      ? {
          id: s.reward.id,
          tokenAmount: s.reward.tokenAmount,
          transactionHash: s.reward.transactionHash,
          transactionStatus: s.reward.transactionStatus,
        }
      : null,
  };
}

// Create a submission. The citizen is taken from the login token, never from the request body.
router.post(
  '/submissions',
  upload.single('evidence'),
  verifyImage,
  validate(submissionSchema),
  asyncHandler(async (req, res) => {
    const s = await prisma.recyclingSubmission.create({
      data: {
        citizenId: req.user.id,
        wasteCategory: req.body.wasteCategory,
        quantityKg: req.body.quantityKg,
        collectionLocation: req.body.collectionLocation,
        recyclingDate: req.body.recyclingDate,
        evidenceImagePath: req.file ? req.file.filename : null,
        status: 'PENDING',
      },
      include: { reward: true },
    });
    res.status(201).json({ submission: shape(s) });
  })
);

router.get(
  '/submissions',
  asyncHandler(async (req, res) => {
    const rows = await prisma.recyclingSubmission.findMany({
      where: { citizenId: req.user.id },
      include: { reward: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ submissions: rows.map(shape) });
  })
);

router.get(
  '/rewards',
  asyncHandler(async (req, res) => {
    const rewards = await prisma.reward.findMany({
      where: { citizenId: req.user.id },
      include: { submission: true },
      orderBy: { createdAt: 'desc' },
    });
    const earned = rewards
      .filter((r) => r.transactionStatus === 'CONFIRMED')
      .reduce((sum, r) => sum + r.tokenAmount, 0);
    res.json({
      totalEarned: round(earned, 3),
      explorerBaseUrl: env.EXPLORER_BASE_URL,
      rewards: rewards.map((r) => ({
        id: r.id,
        tokenAmount: r.tokenAmount,
        transactionHash: r.transactionHash,
        transactionStatus: r.transactionStatus,
        createdAt: r.createdAt,
        submissionId: r.submissionId,
        wasteCategory: r.submission.wasteCategory,
        quantityKg: r.submission.quantityKg,
      })),
    });
  })
);

// Everything the overview page needs in one call.
router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const [subs, board, rewards, rates] = await Promise.all([
      prisma.recyclingSubmission.findMany({
        where: { citizenId: req.user.id },
        include: { reward: true },
        orderBy: { createdAt: 'desc' },
      }),
      buildLeaderboard(),
      prisma.reward.findMany({
        where: { citizenId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      getRates(),
    ]);

    const verified = subs.filter((s) => VERIFIED_STATUSES.includes(s.status));
    const myRank = board.find((r) => r.userId === req.user.id);
    const confirmed = await prisma.reward.aggregate({
      where: { citizenId: req.user.id, transactionStatus: 'CONFIRMED' },
      _sum: { tokenAmount: true },
    });

    res.json({
      stats: {
        totalActivities: subs.length,
        pending: subs.filter((s) => s.status === 'PENDING').length,
        verifiedKg: round(verified.reduce((a, s) => a + s.quantityKg, 0), 3),
        tokensEarned: round(confirmed._sum.tokenAmount || 0, 3),
        rank: myRank ? myRank.rank : null,
        participants: board.length,
      },
      monthly: monthlySeries(subs, 6),
      categories: categoryBreakdown(subs),
      recentActivities: subs.slice(0, 5).map(shape),
      pendingActivities: subs.filter((s) => s.status === 'PENDING').slice(0, 5).map(shape),
      recentRewards: rewards,
      rates,
    });
  })
);

// Quick estimate shown on the submit form (the contract decides the real amount).
router.get(
  '/estimate',
  asyncHandler(async (req, res) => {
    const rates = await getRates();
    const category = String(req.query.category || '').toUpperCase();
    const kg = Number(req.query.kg);
    if (!(category in rates) || !(kg > 0)) throw new HttpError(400, 'category and kg are required');
    res.json({ estimatedTokens: estimateTokens(kg, rates[category]), ratePerKg: rates[category] });
  })
);

module.exports = router;
