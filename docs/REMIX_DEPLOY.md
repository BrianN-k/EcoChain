# Deploying EcoChainRewards with Remix (Phase 7)

You need: MetaMask on **Sepolia**, your **Admin** account holding some Sepolia ETH.

## A. Compile
1. Open https://remix.ethereum.org
2. In **File Explorer**, create `contracts/EcoChainRewards.sol` and paste the contents of this project's `contracts/EcoChainRewards.sol`.
3. Open the **Solidity Compiler** tab. Choose compiler **0.8.20 or newer (0.8.2x)**, tick *Auto compile*, click **Compile**.
   - Remix downloads OpenZeppelin automatically from the `@openzeppelin/contracts/...` imports (version 5.x).
   - Green tick = success. If you see an import error for `Pausable.sol`, you are on OpenZeppelin 4.x: use `@openzeppelin/contracts@5.0.2/...` in the three import lines.

## B. Run the unit tests (do this BEFORE deploying)
1. Create `tests/EcoChainRewards_test.sol` and paste this project's `contracts/tests/EcoChainRewards_test.sol`.
2. Open the **Solidity Unit Testing** plugin (activate it from the Plugin Manager if it is missing).
3. Select the test file → **Run**.
4. Expected: all 11 tests pass (default rates, correct mint amount, duplicate reverts, invalid category, zero/over-max quantity, zero address, preview formula, rate changes, pause, and two access-control tests).
5. Screenshot the results for your testing chapter. If any test fails, **stop** and fix before deploying.

## C. Deploy to Sepolia
1. **Deploy & Run Transactions** tab → Environment: **Injected Provider - MetaMask**.
2. MetaMask must show the **Sepolia** network and your **Admin** account.
3. Contract: `EcoChainRewards`.
4. Constructor argument `initialAdmin`: paste your **Admin account address** (copy it from MetaMask).
5. Click **Deploy** and confirm in MetaMask.
6. Under *Deployed Contracts*, copy the contract address.

The admin address receives both `DEFAULT_ADMIN_ROLE` and `REWARD_ADMIN_ROLE`.

## D. Verify in Remix before connecting the website
In the deployed contract panel:
- `ratePerKg` with input `0` → `10`
- `hasRole(REWARD_ADMIN_ROLE, <your admin address>)` → `true` (get the role id from the `REWARD_ADMIN_ROLE` button)
- `previewReward(0, 2500)` → `25000000000000000000` (25 ECO)

Optional manual test with a real transaction: call `rewardRecycling(<citizen address>, 0x<any 32-byte hex>, 0, 1000)`, then call it again with the same id: the second call must **revert** with "Submission already rewarded".

## E. Connect the website
1. Put the address in `server\.env` as `CONTRACT_ADDRESS`, add your `SEPOLIA_RPC_URL`, restart the server.
2. Save the address and the transaction hash of the deployment for your report. View it at `https://sepolia.etherscan.io/address/<address>`.
3. Optional: add the token in MetaMask (Import tokens → paste the contract address; symbol ECO, 18 decimals) so citizens can see the balance in their wallet.

## F. Adding another administrator later
Call `grantRole(REWARD_ADMIN_ROLE, <address>)` from the deployer account. Remove with `revokeRole`.
Changing a reward rate: call `setRate(category, rate)` from the deployer, then update the same rate in the website's **Settings** page so estimates match.

## Troubleshooting
| Problem | Fix |
|---|---|
| MetaMask shows wrong network | Switch to Sepolia before deploying |
| "insufficient funds" | Get more Sepolia ETH for the Admin account |
| Website says "not an authorised reward admin" | The MetaMask account connected is not the one passed to the constructor, or `grantRole` was not called for it |
| Website says contract not configured | `CONTRACT_ADDRESS` missing in `server\.env`, or the server was not restarted |
| Reward stays PROCESSING | Wait for confirmation, then click **Refresh status**. Also check `SEPOLIA_RPC_URL` |
