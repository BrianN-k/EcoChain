// Human-readable ABI (ethers v6). It lists only the functions the website uses.
// It matches contracts/EcoChainRewards.sol. If you change the contract's function signatures,
// update this list too.
export const ECO_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function totalEarned(address) view returns (uint256)',
  'function ratePerKg(uint256) view returns (uint256)',
  'function maxGramsPerSubmission() view returns (uint256)',
  'function REWARD_ADMIN_ROLE() view returns (bytes32)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function isRewarded(bytes32 submissionId) view returns (bool)',
  'function previewReward(uint8 category, uint256 grams) view returns (uint256)',
  'function paused() view returns (bool)',
  'function rewardRecycling(address citizen, bytes32 submissionId, uint8 category, uint256 grams) returns (uint256)',
  'function setRate(uint8 category, uint256 newRate)',
  'event RewardIssued(bytes32 indexed submissionId, address indexed citizen, uint8 category, uint256 grams, uint256 amount)',
];

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_HEX = '0xaa36a7';
