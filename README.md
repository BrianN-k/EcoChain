# EcoChain
**Recycle. Earn. Build a Greener Future.**
Blockchain-Based Decentralized Waste Management and Recycling Rewards System, KCA University, SDG 11 (Sustainable Cities and Communities).

Stack: React + Vite + Tailwind · Node + Express · SQLite + Prisma · Solidity (OpenZeppelin) on Sepolia · MetaMask + Ethers.js. **No Docker.**

---

## IMPORTANT: verification status (read this first)

This project was produced in an environment that could not download npm packages, so the following was **not** run before delivery:

| Part | Status |
|---|---|
| Server JavaScript | Syntax-checked. Pure reward-maths tests pass (`tests/rewards.test.js`). |
| Server API tests (`tests/api.test.js`) | **Written, not yet run.** Run `npm test` on your PC (step 3 below). |
| Client (React) | Syntax-checked, and every import and export cross-checked. **`npm run build` has not been run.** |
| Smart contract | Reviewed by hand. **Not compiled and its Remix tests not yet run.** |
| Sepolia deployment, MetaMask flow | **Not done.** Needs your wallet, so it can only be done by you (see `docs/REMIX_DEPLOY.md`). |

Expect a few small fixes on first run. Work through the steps in order and stop at the first error. Do not move on until each step is green.

---

## 1. Install the tools (once)
1. **Node.js LTS** (v20 or v22): https://nodejs.org. Check in PowerShell: `node -v` and `npm -v`.
2. **VS Code**: https://code.visualstudio.com
3. **MetaMask** browser extension. Write your seed phrase on paper. **Never type or paste it anywhere.**
4. Create two MetaMask accounts: **Admin** (deploys the contract and approves rewards) and **Citizen** (test recipient).
5. Switch MetaMask to the **Sepolia** test network and get free Sepolia ETH for the Admin account from a Sepolia faucet.
6. A free **Alchemy** or **Infura** account → create a Sepolia app → copy the HTTPS URL (used by the server only to *read* the chain).

If PowerShell says "running scripts is disabled", run once:
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## 2. Run the server (Terminal 1)
```powershell
cd ecochain\server
copy .env.example .env
```
Open `server\.env` and set `JWT_SECRET`. Generate one with:
```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Then:
```powershell
npm install
npm run db:push
npm run create-admin -- "Your Name" admin@example.com "YourStrongPass1"
npm run db:seed        # optional: demo citizens (labelled as demo data)
npm run dev
```
Open http://localhost:3001/api/health. You should see `{"ok":true}`.

## 3. Test the server
```powershell
cd ecochain\server
npm test
```
All tests should pass. Paste any failure to your mentor/assistant before continuing.

## 4. Run the website (Terminal 2)
```powershell
cd ecochain\client
npm install
npm run dev
```
Open http://localhost:5173. Check a production build also works:
```powershell
npm run build
```

## 5. Deploy the contract (Phase 7)
Follow **`docs/REMIX_DEPLOY.md`**. When done, put the contract address and RPC URL in `server\.env`:
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/xxxx
CONTRACT_ADDRESS=0xYourContractAddress
```
Restart the server. The website reads the address from the server, so no frontend change is needed.

## 6. The live demo flow
1. Register a citizen → **My Wallet → Link wallet** (MetaMask asks for a free signature, not a transaction).
2. **Submit Recycling** with a photo.
3. Log in as admin (use a second browser profile) → **Recycling Submissions → open it → Approve**.
4. Click **Authorise reward** → MetaMask (Admin account) → Confirm.
5. The server verifies the transaction on Sepolia itself. The citizen sees the status, ECO balance and an Etherscan link.
6. Try to reward again: the database, the API **and the contract** all refuse (duplicate protection).

## Folder map
```
contracts/            EcoChainRewards.sol + Remix unit tests
server/               Express API, Prisma schema, scripts, tests
client/               React website (public, citizen, admin)
docs/                 Deploy guide, test plan, report draft, diagrams
```

## Security summary
- Passwords hashed (bcrypt). JWT login. Role checks on the **server** for every admin/citizen route; the contract has its own role check.
- Registration can only create CITIZEN accounts. Admins are created only by `npm run create-admin`.
- The server holds **no private key**. Admins sign rewards in their own MetaMask. The server verifies the receipt (contract address, event, citizen, grams) before marking a reward confirmed.
- Duplicate-reward protection in 4 layers: UI → API status rules → database `UNIQUE(submissionId)` → contract `rewarded[submissionId]`.
- Uploads: JPG/PNG/WebP only, 5 MB, real file-signature check, random server-chosen filenames, served only to logged-in users.
- No personal data on-chain (only a hash of the submission id).

## Known limitations (state these honestly in your report)
- The blockchain cannot prove recycling really happened. The administrator is a trusted verifier.
- A compromised admin wallet could mint rewards (capped per submission). Use a separate wallet for admin work.
- Supply is uncapped and Sepolia tokens have no value. Token redemption is a "Coming Soon" future feature.
- Reward rates exist both in the database (for estimates) and on the contract (the real amount). Changing a rate in Settings also requires calling `setRate` on the contract.
- SQLite is for development. Use PostgreSQL in production.
- The contract is unaudited.
