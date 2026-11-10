// The ORDER of CATEGORIES must match the category index used in the smart contract:
// 0 = Plastic, 1 = Paper, 2 = Glass, 3 = Metal
const CATEGORIES = ['PLASTIC', 'PAPER', 'GLASS', 'METAL'];

// Submission statuses
const STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REWARD_PROCESSING: 'REWARD_PROCESSING',
  REWARDED: 'REWARDED',
};

// Statuses that count as "verified" recycling (admin approved it)
const VERIFIED_STATUSES = ['APPROVED', 'REWARD_PROCESSING', 'REWARDED'];

// Demonstration reward rates: whole ECO tokens per kg.
// Stored in the Setting table once an admin changes them.
const DEFAULT_RATES = { PLASTIC: 10, PAPER: 8, GLASS: 7, METAL: 12 };

const MAX_KG_PER_SUBMISSION = 1000; // must be <= contract maxGramsPerSubmission / 1000

module.exports = { CATEGORIES, STATUS, VERIFIED_STATUSES, DEFAULT_RATES, MAX_KG_PER_SUBMISSION };
