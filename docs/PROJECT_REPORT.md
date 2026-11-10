# EcoChain: Report Draft
Blockchain-Based Decentralized Waste Management and Recycling Rewards System
KCA University · SDG 11: Sustainable Cities and Communities

> **How to use this draft.** Chapters 1–3 and the justification are written for you to adapt in your own words (lecturers check originality). Confirm KCA's required template and referencing style. APA 7 is assumed. Insert your own screenshots and test results. **Verify every reference yourself** (publisher page or DOI) before submitting.

---

## Chapter 1: Introduction

### 1.1 Background of the study
Rapid urbanisation increases the volume of municipal solid waste. The World Bank's *What a Waste 2.0* estimates that global waste could grow from about 2.01 billion tonnes in 2016 to 3.40 billion tonnes by 2050 (Kaza et al., 2018). SDG 11 calls for cities that are inclusive, safe, resilient and sustainable, and Target 11.6 specifically addresses the environmental impact of cities, including municipal waste management (United Nations, 2015). Source-separated recycling by citizens reduces landfill load, but participation depends on motivation and trust that effort is recognised fairly.

Blockchain technology offers a shared, append-only record that participants can inspect without trusting a single record keeper (Nakamoto, 2008). Smart contracts on programmable blockchains such as Ethereum can enforce rules automatically (Buterin, 2014), and the ERC-20 standard defines a common interface for fungible tokens (Vogelsteller & Buterin, 2015). EcoChain applies these ideas to recycling incentives.

> *Add:* Kenyan context from sources you find and verify yourself (e.g. the Sustainable Waste Management Act, 2022; NEMA and Nairobi City County reports). Do not state local statistics you have not read in a source.

### 1.2 Problem statement
1. Low participation in recycling.
2. Weak incentives for responsible disposal.
3. Reward distribution that citizens cannot independently verify.
4. Inefficient monitoring of recycling contributions.
5. Difficulty tracking verified recycling.
6. Limited accountability in community waste management.

### 1.3 General objective
To design, develop and evaluate a blockchain-based platform that records verified recycling activity and distributes ECO token rewards transparently.

### 1.4 Specific objectives
1. To analyse requirements for a recycling rewards system with citizen and administrator roles.
2. To design a three-part architecture (web application, API with database, smart contract).
3. To implement a submission, verification and reward workflow with duplicate-reward prevention.
4. To deploy an ERC-20 based reward contract on the Sepolia test network and integrate it using MetaMask and Ethers.js.
5. To test the system for functionality, security and usability.

### 1.5 Research questions
1. What requirements must a recycling rewards platform meet?
2. How can reward issuance be made transparent and tamper-evident?
3. How can duplicate rewards be prevented at every layer?
4. How well does the prototype perform against its functional and security tests?

### 1.6 Justification
Citizens can verify on a public explorer that a reward was issued, to whom, and once only, which a private database alone cannot prove. The project also demonstrates a practical split between on-chain and off-chain responsibilities.

### 1.7 Scope
In scope: citizen and administrator web apps, recycling categories (plastic, paper, glass, metal), evidence upload, admin verification, ECO rewards on Sepolia, analytics.
Out of scope: token redemption (future feature), mainnet deployment, mobile apps, automated image recognition, IoT weighing, payment integrations.

### 1.8 Limitations
- The blockchain cannot verify physical recycling; administrators are trusted verifiers.
- Sepolia tokens have no monetary value.
- The prototype runs on SQLite and a single server; the contract is not professionally audited.
- Testing was limited to the developer's environment and a small number of users.

---

## Chapter 2: Literature Review (outline)
Write 1,500–2,500 words under these headings, citing only sources you have read:
1. Waste management and recycling participation (Kaza et al., 2018; Kenyan policy sources you locate).
2. Incentive mechanisms for recycling.
3. Blockchain fundamentals (Nakamoto, 2008; Buterin, 2014).
4. Smart contracts and token standards (Vogelsteller & Buterin, 2015; OpenZeppelin, n.d.).
5. When is a blockchain appropriate? (Wüst & Gervais, 2018; Iansiti & Lakhani, 2017).
6. Existing recycling-reward systems, and the gap EcoChain addresses. *Search Google Scholar and the KCA library databases for peer-reviewed studies on blockchain and waste management, and cite only those you can open.*

---

## Chapter 3: Why blockchain, and what a normal database could do

| Function | Where it lives | Reason |
|---|---|---|
| Accounts, passwords, profile | Database | Private, editable, needs fast queries |
| Recycling submissions, photos | Database + file storage | Contains personal and bulky data. Not for on-chain storage |
| Admin review queue, notifications, analytics | Database | Ordinary CRUD, no need for consensus |
| **ECO token ownership and balances** | **Blockchain** | Public, shared ledger |
| **"This submission was rewarded exactly once"** | **Blockchain (+ DB)** | Enforced by code nobody can quietly edit |
| **Reward history (who, how much, when)** | **Blockchain events** | Independently auditable by citizens |

**Honest assessment.** A single organisation running a trusted database could implement the whole workflow. Blockchain adds value only because rewards represent transferable value that third parties (citizens, auditors, partner organisations) should be able to verify without trusting EcoChain's server. This matches the guidance that a blockchain is justified when multiple parties need a shared, tamper-evident record and do not fully trust a single writer (Wüst & Gervais, 2018). It does **not** solve the oracle problem: the chain cannot know whether recycling really happened. EcoChain therefore keeps the admin as a trusted verifier and uses the chain for what follows verification.

---

## Chapter 4: System Requirements

### 4.1 Functional requirements
| ID | Requirement |
|---|---|
| FR1 | Citizens can register, log in/out, and manage a profile and password |
| FR2 | Citizens can link a MetaMask wallet by signing a message (proof of ownership) |
| FR3 | Citizens submit recycling (category, kg, location, date, optional photo) and receive a unique ID with status PENDING |
| FR4 | Citizens track statuses, rejection reasons, rewards, balances, transactions, leaderboard |
| FR5 | Administrators review evidence and approve or reject with a reason |
| FR6 | Only administrators can authorise rewards, signing in MetaMask |
| FR7 | The system prevents duplicate rewards (UI, API, database, contract) |
| FR8 | The server verifies reward transactions on-chain before confirming |
| FR9 | Administrators view citizens, token distribution, blockchain records, reports (CSV export) |
| FR10 | Administrators manage reward rates and citizen account status |
| FR11 | Public site presents EcoChain, impact figures (demo data labelled) and how it works |

### 4.2 Non-functional requirements
Security (hashing, JWT, RBAC, validation, upload controls, no private keys on server) · Usability (responsive, clear errors, toasts, skeleton loading) · Performance (typical page data in a single API call) · Reliability (guarded state transitions, idempotent re-checks) · Maintainability (modular routes, services, validators) · Portability (runs on Windows without Docker) · Privacy (no personal data on-chain, leaderboard shows display names only).

---

## Chapter 5: Design
Insert the diagrams from `docs/diagrams/`:
- Architecture (`architecture.png`)
- Use case (`usecase.png`)
- Activity: submission to reward (`activity.png`)
- Sequence: reward flow (`sequence_reward.png`)
- ERD (`erd.png`)

### 5.1 Smart contract architecture
`EcoChainRewards` inherits OpenZeppelin `ERC20`, `AccessControl` and `Pausable`.
- Roles: `DEFAULT_ADMIN_ROLE` (rates, cap, pause, role management) and `REWARD_ADMIN_ROLE` (issue rewards).
- `rewardRecycling(citizen, submissionId, category, grams)` checks role, not paused, non-zero addresses/ids, **not already rewarded**, valid category, grams within `(0, max]`; then marks rewarded **before** minting (checks-effects-interactions), mints, and emits `RewardIssued`.
- Reward = `grams × ratePerKg × 1e18 / 1000` (integer maths; defaults Plastic 10, Paper 8, Glass 7, Metal 12 ECO/kg; demonstration values).
- `submissionId` on-chain is `keccak256(database id)`: no personal data on-chain.

### 5.2 Security design and residual risks
Layered duplicate protection; backend RBAC plus contract RBAC; receipt verification checks status, target contract, event arguments (submission hash, citizen, category, grams). Residual risks: compromised admin wallet, uncapped supply, off-chain evidence not verifiable on-chain, tx-hash recording gap between browser and server, unaudited contract.

---

## Chapter 6: Implementation (summary to expand)
- **Server:** Express routes (`auth`, `users`, `citizen`, `admin`, `public`), Prisma models, Zod validation, Multer uploads with signature check, receipt verification service using Ethers.js against a Sepolia RPC.
- **Client:** React + Vite + Tailwind, React Router with role guards, Recharts, Ethers.js BrowserProvider for MetaMask.
- **Blockchain:** Solidity contract developed, tested and deployed in Remix IDE to Sepolia. Record: contract address, deployment transaction hash, admin address.

## Chapter 7: Testing
Use `docs/TESTING.md`. Include automated results (`npm test`), Remix test screenshots, Etherscan screenshots of real reward transactions, and a defect log (found, fixed, re-tested).

## Chapter 8: User manual (outline)
Citizen: register → link wallet → submit → track → view rewards. Admin: log in → review queue → approve/reject → authorise reward in MetaMask → view blockchain records and reports. Include screenshots.

## Chapter 9: Conclusion and recommendations
**Conclusion:** Write after testing, stating which objectives were met, with evidence.
**Recommendations / future work:** token redemption with partner merchants; server-side event indexer to remove the hash-recording gap; multi-signature or timelocked admin; supply cap and treasury model; contract audit; IoT or QR-verified weighing at collection points; PostgreSQL and cloud object storage; mobile app; migration to a low-fee network for production.

---

## References (APA 7). Verify each before submitting
Buterin, V. (2014). *A next-generation smart contract and decentralized application platform* [White paper]. Ethereum. https://ethereum.org/en/whitepaper/

Iansiti, M., & Lakhani, K. R. (2017). The truth about blockchain. *Harvard Business Review, 95*(1), 118–127.

Kaza, S., Yao, L., Bhada-Tata, P., & Van Woerden, F. (2018). *What a waste 2.0: A global snapshot of solid waste management to 2050*. World Bank. https://doi.org/10.1596/978-1-4648-1329-0

Nakamoto, S. (2008). *Bitcoin: A peer-to-peer electronic cash system*. https://bitcoin.org/bitcoin.pdf

OpenZeppelin. (n.d.). *OpenZeppelin Contracts documentation*. https://docs.openzeppelin.com/contracts

United Nations. (2015). *Transforming our world: The 2030 Agenda for Sustainable Development* (A/RES/70/1). https://sdgs.un.org/2030agenda

Vogelsteller, F., & Buterin, V. (2015). *EIP-20: ERC-20 token standard*. Ethereum Improvement Proposals. https://eips.ethereum.org/EIPS/eip-20

Wüst, K., & Gervais, A. (2018). Do you need a blockchain? In *2018 Crypto Valley Conference on Blockchain Technology (CVCBT)* (pp. 45–54). IEEE. https://doi.org/10.1109/CVCBT.2018.00011

*Add Kenyan policy and peer-reviewed waste-management/blockchain sources you personally locate and read.*

---

## Demo script (10 minutes)
1. (1 min) Landing page, problem, SDG 11.
2. (1 min) Architecture slide: what is on-chain and what is not, and why.
3. (2 min) Register citizen, link wallet (signature, not a transaction).
4. (1 min) Submit recycling with a photo. Show PENDING.
5. (2 min) Admin: review evidence, approve, authorise reward in MetaMask.
6. (1 min) Citizen: confirmed reward, ECO balance, Etherscan link.
7. (1 min) Attempt a duplicate: show the refusal at the contract level.
8. (1 min) Reports, limitations and future work.

**Likely examiner questions:** Why blockchain instead of a database? Who verifies the recycling? What if the admin key is stolen? Why Sepolia? What happens if the server crashes after the transaction? How are rates kept consistent? Prepare answers from Chapters 3 and 5.
