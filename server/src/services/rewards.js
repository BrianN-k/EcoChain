const prisma = require('../config/prisma');
const { CATEGORIES, STATUS } = require('../config/constants');
const { toGrams, estimateTokens } = require('../utils/rewards');
const { verifyRewardTx, onchainSubmissionId } = require('./blockchain');
const { getRates } = require('./settings');

// What the contract should have been called with for this submission.
async function expectedFor(submission, citizenWallet) {
  const rates = await getRates();
  return {
    onchainId: onchainSubmissionId(submission.id),
    citizen: citizenWallet,
    categoryIndex: CATEGORIES.indexOf(submission.wasteCategory),
    grams: toGrams(submission.quantityKg),
    estimatedTokens: estimateTokens(submission.quantityKg, rates[submission.wasteCategory]),
  };
}

/**
 * Re-check a PROCESSING reward on the blockchain and update the database.
 * Safe to call many times: only a PROCESSING reward can change state, and the
 * updateMany() guard means two simultaneous calls cannot both apply the result.
 */
async function settleReward(rewardId) {
  const reward = await prisma.reward.findUnique({
    where: { id: rewardId },
    include: { submission: true, citizen: true },
  });
  if (!reward || reward.transactionStatus !== 'PROCESSING' || !reward.transactionHash) return reward;
  if (!reward.citizen.walletAddress) return reward;

  const expected = await expectedFor(reward.submission, reward.citizen.walletAddress);
  const result = await verifyRewardTx(reward.transactionHash, expected);

  if (result.state === 'PENDING') {
    if (result.reason && result.reason !== reward.failureReason) {
      await prisma.reward.update({ where: { id: rewardId }, data: { failureReason: result.reason } });
    }
    return prisma.reward.findUnique({ where: { id: rewardId } });
  }

  if (result.state === 'CONFIRMED') {
    await prisma.$transaction(async (tx) => {
      const changed = await tx.reward.updateMany({
        where: { id: rewardId, transactionStatus: 'PROCESSING' },
        data: {
          transactionStatus: 'CONFIRMED',
          tokenAmount: Number(result.amount),
          failureReason: null,
        },
      });
      if (changed.count !== 1) return;
      await tx.recyclingSubmission.update({
        where: { id: reward.submissionId },
        data: { status: STATUS.REWARDED },
      });
      await tx.notification.create({
        data: {
          userId: reward.citizenId,
          title: 'Reward received',
          message: `You received ${result.amount} ECO for your ${reward.submission.wasteCategory.toLowerCase()} recycling.`,
        },
      });
    });
  } else {
    // FAILED: send the submission back to APPROVED so an administrator can retry.
    await prisma.$transaction(async (tx) => {
      const changed = await tx.reward.updateMany({
        where: { id: rewardId, transactionStatus: 'PROCESSING' },
        data: { transactionStatus: 'FAILED', failureReason: result.reason },
      });
      if (changed.count !== 1) return;
      await tx.recyclingSubmission.update({
        where: { id: reward.submissionId },
        data: { status: STATUS.APPROVED },
      });
    });
  }

  return prisma.reward.findUnique({ where: { id: rewardId } });
}

module.exports = { expectedFor, settleReward };
