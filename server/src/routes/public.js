const express = require('express');
const prisma = require('../config/prisma');
const env = require('../config/env');
const { asyncHandler } = require('../utils/errors');
const { VERIFIED_STATUSES } = require('../config/constants');
const { buildLeaderboard, categoryBreakdown, round } = require('../services/stats');
const { getRates } = require('../services/settings');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Real totals for the landing/impact pages. Demo accounts are counted separately and flagged,
// so the site never presents seeded data as real achievements.
router.get(
  '/public/stats',
  asyncHandler(async (req, res) => {
    const subs = await prisma.recyclingSubmission.findMany({ include: { citizen: { select: { isDemo: true } } } });
    const verified = subs.filter((s) => VERIFIED_STATUSES.includes(s.status));
    const real = verified.filter((s) => !s.citizen.isDemo);
    const demo = verified.filter((s) => s.citizen.isDemo);
    const [citizens, tokens] = await Promise.all([
      prisma.user.count({ where: { role: 'CITIZEN' } }),
      prisma.reward.aggregate({ where: { transactionStatus: 'CONFIRMED' }, _sum: { tokenAmount: true } }),
    ]);
    res.json({
      citizens,
      verifiedKg: round(verified.reduce((a, s) => a + s.quantityKg, 0), 1),
      realVerifiedKg: round(real.reduce((a, s) => a + s.quantityKg, 0), 1),
      demoVerifiedKg: round(demo.reduce((a, s) => a + s.quantityKg, 0), 1),
      containsDemoData: demo.length > 0,
      tokensDistributed: round(tokens._sum.tokenAmount || 0, 1),
      categories: categoryBreakdown(verified),
      rates: await getRates(),
    });
  })
);

// Frontend-facing blockchain configuration (public information only).
router.get('/config', (req, res) => {
  res.json({
    contractAddress: env.CONTRACT_ADDRESS || null,
    chainId: env.CHAIN_ID,
    explorerBaseUrl: env.EXPLORER_BASE_URL,
  });
});

// Leaderboard: display name + totals only. No emails, no real names, no wallets.
router.get(
  '/leaderboard',
  requireAuth,
  asyncHandler(async (req, res) => {
    const board = await buildLeaderboard();
    res.json({
      leaderboard: board.slice(0, 50).map((r) => ({
        rank: r.rank,
        displayName: r.displayName,
        verifiedKg: r.verifiedKg,
        tokensEarned: r.tokensEarned,
        isYou: r.userId === req.user.id,
      })),
    });
  })
);

module.exports = router;
