// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.20 <0.9.0;

// Remix "Solidity Unit Testing" plugin test file.
// Put the contract at contracts/EcoChainRewards.sol and this file at tests/EcoChainRewards_test.sol,
// then open the "Solidity Unit Testing" plugin, select this file and click Run.
import "remix_tests.sol";
import "remix_accounts.sol";
import "../contracts/EcoChainRewards.sol";

contract EcoChainRewardsTest {
    EcoChainRewards eco; // this test contract is the admin of this instance
    address citizen;

    function beforeAll() public {
        citizen = TestsAccounts.getAccount(1);
        eco = new EcoChainRewards(address(this));
    }

    function testDefaultRates() public {
        Assert.equal(eco.ratePerKg(0), uint256(10), "plastic should be 10");
        Assert.equal(eco.ratePerKg(1), uint256(8), "paper should be 8");
        Assert.equal(eco.ratePerKg(2), uint256(7), "glass should be 7");
        Assert.equal(eco.ratePerKg(3), uint256(12), "metal should be 12");
    }

    function testRewardMintsCorrectAmount() public {
        bytes32 id = keccak256("sub-1");
        // 2.5 kg plastic = 2500 g x 10 = 25 ECO
        eco.rewardRecycling(citizen, id, 0, 2500);
        Assert.equal(eco.balanceOf(citizen), uint256(25 ether), "citizen should hold 25 ECO");
        Assert.equal(eco.totalEarned(citizen), uint256(25 ether), "totalEarned should be 25 ECO");
        Assert.ok(eco.isRewarded(id), "submission should be marked rewarded");
    }

    function testDuplicateRewardReverts() public {
        bytes32 id = keccak256("sub-1"); // already rewarded in the previous test
        try eco.rewardRecycling(citizen, id, 0, 2500) {
            Assert.ok(false, "second reward must revert");
        } catch Error(string memory reason) {
            Assert.equal(reason, "Submission already rewarded", "wrong revert reason");
        } catch {
            Assert.ok(false, "unexpected failure type");
        }
        Assert.equal(eco.balanceOf(citizen), uint256(25 ether), "balance must not change");
    }

    function testInvalidCategoryReverts() public {
        try eco.rewardRecycling(citizen, keccak256("sub-2"), 4, 1000) {
            Assert.ok(false, "category 4 must revert");
        } catch Error(string memory reason) {
            Assert.equal(reason, "Invalid category", "wrong revert reason");
        } catch {
            Assert.ok(false, "unexpected failure type");
        }
    }

    function testZeroAndExcessiveQuantityRevert() public {
        try eco.rewardRecycling(citizen, keccak256("sub-3"), 0, 0) {
            Assert.ok(false, "zero grams must revert");
        } catch {
            Assert.ok(true, "reverted as expected");
        }
        try eco.rewardRecycling(citizen, keccak256("sub-4"), 0, 1_000_001) {
            Assert.ok(false, "above maximum must revert");
        } catch {
            Assert.ok(true, "reverted as expected");
        }
    }

    function testZeroAddressCitizenReverts() public {
        try eco.rewardRecycling(address(0), keccak256("sub-5"), 0, 1000) {
            Assert.ok(false, "zero address must revert");
        } catch {
            Assert.ok(true, "reverted as expected");
        }
    }

    function testPreviewMatchesFormula() public {
        // 1.234 kg paper = 1234 g x 8 / 1000 = 9.872 ECO
        Assert.equal(eco.previewReward(1, 1234), uint256(9.872 ether), "preview mismatch");
    }

    function testAdminCanChangeRateAndInvalidRateReverts() public {
        eco.setRate(0, 15);
        Assert.equal(eco.ratePerKg(0), uint256(15), "rate should update");
        try eco.setRate(0, 0) {
            Assert.ok(false, "rate 0 must revert");
        } catch {
            Assert.ok(true, "reverted as expected");
        }
        try eco.setRate(0, 1001) {
            Assert.ok(false, "rate above max must revert");
        } catch {
            Assert.ok(true, "reverted as expected");
        }
        eco.setRate(0, 10); // restore
    }

    function testPauseBlocksRewards() public {
        eco.pause();
        try eco.rewardRecycling(citizen, keccak256("sub-6"), 0, 1000) {
            Assert.ok(false, "paused contract must revert");
        } catch {
            Assert.ok(true, "reverted as expected");
        }
        eco.unpause();
        eco.rewardRecycling(citizen, keccak256("sub-6"), 0, 1000);
        Assert.ok(eco.isRewarded(keccak256("sub-6")), "works again after unpause");
    }

    // --- Access control: a contract whose admin is SOMEONE ELSE ----------------------
    // The test contract has no roles on this instance, so every restricted call must revert.
    function testUnauthorizedCallerCannotReward() public {
        EcoChainRewards other = new EcoChainRewards(TestsAccounts.getAccount(2));
        try other.rewardRecycling(citizen, keccak256("x"), 0, 1000) {
            Assert.ok(false, "caller without REWARD_ADMIN_ROLE must revert");
        } catch {
            Assert.ok(true, "reverted as expected");
        }
        Assert.equal(other.balanceOf(citizen), uint256(0), "nothing minted");
    }

    function testUnauthorizedCallerCannotChangeRatesOrPause() public {
        EcoChainRewards other = new EcoChainRewards(TestsAccounts.getAccount(2));
        try other.setRate(0, 999) {
            Assert.ok(false, "setRate must revert for non-admin");
        } catch {
            Assert.ok(true, "reverted as expected");
        }
        try other.pause() {
            Assert.ok(false, "pause must revert for non-admin");
        } catch {
            Assert.ok(true, "reverted as expected");
        }
    }
}
