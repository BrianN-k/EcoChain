// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EcoChainRewards
 * @notice ERC-20 "ECO" token that is minted ONLY as a reward for verified recycling.
 *
 * Security model
 *  - DEFAULT_ADMIN_ROLE  : can change rates, the per-submission cap, pause, and manage roles.
 *  - REWARD_ADMIN_ROLE   : can issue rewards (the verified EcoChain administrators).
 *  - Each submission id can be rewarded exactly ONCE (on-chain duplicate protection).
 *  - No personal data is stored: the submission id is a keccak256 hash of the database id.
 *
 * Reward formula (all integer maths, because Solidity has no decimals):
 *   amount (in wei-units, 18 decimals) = grams * ratePerKg * 1e18 / 1000
 *   e.g. 2.5 kg of plastic (rate 10) -> 2500 * 10 * 1e18 / 1000 = 25 ECO
 *
 * Limitations (document these in your report):
 *  - The chain cannot verify that recycling physically happened; the administrator is trusted.
 *  - A compromised reward-admin wallet could mint rewards (bounded by the per-submission cap).
 *  - Supply is uncapped; this is a demonstration token with no monetary value on Sepolia.
 *  - This contract has not been professionally audited.
 */
contract EcoChainRewards is ERC20, AccessControl, Pausable {
    bytes32 public constant REWARD_ADMIN_ROLE = keccak256("REWARD_ADMIN_ROLE");

    // Category indexes: 0 = Plastic, 1 = Paper, 2 = Glass, 3 = Metal
    uint8 public constant CATEGORY_COUNT = 4;

    /// @notice Whole ECO tokens rewarded per kilogram, per category.
    uint256[4] public ratePerKg;

    /// @notice Upper limit for a single reward, in grams (default 1,000 kg).
    uint256 public maxGramsPerSubmission = 1_000_000;

    uint256 public constant MAX_RATE = 1000;

    mapping(bytes32 => bool) private _rewarded;

    /// @notice Total ECO ever earned through rewards by an address (does not drop when tokens move).
    mapping(address => uint256) public totalEarned;

    event RewardIssued(
        bytes32 indexed submissionId,
        address indexed citizen,
        uint8 category,
        uint256 grams,
        uint256 amount
    );
    event RateUpdated(uint8 indexed category, uint256 newRate);
    event MaxGramsUpdated(uint256 newMaxGrams);

    constructor(address initialAdmin) ERC20("EcoChain Token", "ECO") {
        require(initialAdmin != address(0), "Admin is zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(REWARD_ADMIN_ROLE, initialAdmin);

        ratePerKg[0] = 10; // Plastic
        ratePerKg[1] = 8; // Paper
        ratePerKg[2] = 7; // Glass
        ratePerKg[3] = 12; // Metal
    }

    /**
     * @notice Reward a citizen for ONE verified recycling submission.
     * @param citizen      wallet that receives the tokens
     * @param submissionId keccak256 of the off-chain submission id
     * @param category     0 plastic, 1 paper, 2 glass, 3 metal
     * @param grams        verified weight in grams (kg x 1000)
     */
    function rewardRecycling(
        address citizen,
        bytes32 submissionId,
        uint8 category,
        uint256 grams
    ) external onlyRole(REWARD_ADMIN_ROLE) whenNotPaused returns (uint256 amount) {
        require(citizen != address(0), "Citizen is zero address");
        require(submissionId != bytes32(0), "Empty submission id");
        require(!_rewarded[submissionId], "Submission already rewarded");
        require(category < CATEGORY_COUNT, "Invalid category");
        require(grams > 0, "Quantity must be greater than zero");
        require(grams <= maxGramsPerSubmission, "Quantity above maximum");

        // Effects before interactions: mark as rewarded first.
        _rewarded[submissionId] = true;

        amount = previewReward(category, grams);
        totalEarned[citizen] += amount;
        _mint(citizen, amount);

        emit RewardIssued(submissionId, citizen, category, grams, amount);
    }

    /// @notice Has this submission already been rewarded?
    function isRewarded(bytes32 submissionId) external view returns (bool) {
        return _rewarded[submissionId];
    }

    /// @notice How many tokens (18 decimals) would be minted for this category and weight.
    function previewReward(uint8 category, uint256 grams) public view returns (uint256) {
        require(category < CATEGORY_COUNT, "Invalid category");
        return (grams * ratePerKg[category] * 1e18) / 1000;
    }

    function setRate(uint8 category, uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(category < CATEGORY_COUNT, "Invalid category");
        require(newRate > 0 && newRate <= MAX_RATE, "Rate out of range");
        ratePerKg[category] = newRate;
        emit RateUpdated(category, newRate);
    }

    function setMaxGramsPerSubmission(uint256 newMax) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newMax > 0, "Maximum must be greater than zero");
        maxGramsPerSubmission = newMax;
        emit MaxGramsUpdated(newMax);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
