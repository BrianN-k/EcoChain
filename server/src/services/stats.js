const prisma = require('../config/prisma');
const { CATEGORIES, VERIFIED_STATUSES } = require('../config/constants');

// ---- helpers -------------------------------------------------------------

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Last `n` months as keys, oldest first, e.g. ["2026-06", ..., "2026-11"]
function lastMonths(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    out.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return out;
}

const round = (n, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;

// ---- leaderboard -----------------------------------------------------------

// Ranks active citizens by verified kg (ties broken by tokens earned).
// Returns ONLY non-private fields (display name, totals).
async function buildLeaderboard() {
  const [kgRows, tokenRows, users] = await Promise.all([
    prisma.recyclingSubmission.groupBy({
      by: ['citizenId'],
      where: { status: { in: VERIFIED_STATUSES } },
      _sum: { quantityKg: true },
    }),
    prisma.reward.groupBy({
      by: ['citizenId'],
      where: { transactionStatus: 'CONFIRMED' },
      _sum: { tokenAmount: true },
    }),
    prisma.user.findMany({
      where: { role: 'CITIZEN', accountStatus: 'ACTIVE' },
      select: { id: true, displayName: true },
    }),
  ]);

  const kgBy = new Map(kgRows.map((r) => [r.citizenId, r._sum.quantityKg || 0]));
  const tokBy = new Map(tokenRows.map((r) => [r.citizenId, r._sum.tokenAmount || 0]));

  return users
    .map((u) => ({
      userId: u.id,
      displayName: u.displayName,
      verifiedKg: round(kgBy.get(u.id) || 0, 3),
      tokensEarned: round(tokBy.get(u.id) || 0, 3),
    }))
    .filter((r) => r.verifiedKg > 0)
    .sort((a, b) => b.verifiedKg - a.verifiedKg || b.tokensEarned - a.tokensEarned)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

// ---- aggregations over submissions ---------------------------------------

// Verified kg and counts per category from a list of submissions.
function categoryBreakdown(submissions) {
  return CATEGORIES.map((category) => {
    const rows = submissions.filter((s) => s.wasteCategory === category);
    const verified = rows.filter((s) => VERIFIED_STATUSES.includes(s.status));
    return {
      category,
      submissions: rows.length,
      verifiedKg: round(verified.reduce((sum, s) => sum + s.quantityKg, 0), 3),
    };
  });
}

// Verified kg and submission counts per month (by recycling date).
function monthlySeries(submissions, months = 6) {
  return lastMonths(months).map((month) => {
    const inMonth = submissions.filter((s) => monthKey(s.recyclingDate) === month);
    const verified = inMonth.filter((s) => VERIFIED_STATUSES.includes(s.status));
    return {
      month,
      submissions: inMonth.length,
      verifiedKg: round(verified.reduce((sum, s) => sum + s.quantityKg, 0), 3),
    };
  });
}

module.exports = { buildLeaderboard, categoryBreakdown, monthlySeries, monthKey, lastMonths, round };
