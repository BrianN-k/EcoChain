# EcoChain Test Plan and Results Sheet

Fill the **Result** column as you test (Pass / Fail + notes) and screenshot key steps for your report.
"Auto" = covered by `npm test` in `server/`. "Remix" = covered by the Solidity unit tests. "Manual" = do it in the browser.

## A. Authentication and authorisation
| # | Test | Expected | Type | Result |
|---|---|---|---|---|
| A1 | Register with valid details | Account created, lands on citizen dashboard | Auto + Manual | |
| A2 | Register with weak password (`short`) | Rejected with message | Auto | |
| A3 | Register same email twice | 409 "already exists" | Auto | |
| A4 | Register sending `role: ADMIN` | Account is CITIZEN | Auto | |
| A5 | Login wrong password | "Incorrect email or password" | Auto | |
| A6 | Citizen opens `/admin` in the URL bar | Redirected to `/app` | Manual | |
| A7 | Citizen calls `/api/admin/overview` | 403 | Auto | |
| A8 | Logged-out user calls any API | 401 | Auto | |
| A9 | Admin opens `/app` | Redirected to `/admin` | Manual | |
| A10 | Suspended account tries to log in | Refused | Manual | |

## B. Recycling submissions
| # | Test | Expected | Type | Result |
|---|---|---|---|---|
| B1 | Submit valid plastic 5 kg | Created, status PENDING, unique ID | Auto + Manual | |
| B2 | Quantity 0 / negative / 99999 | Rejected | Auto | |
| B3 | Invalid category | Rejected | Auto | |
| B4 | Upload `.php` renamed to `.png` | Rejected (signature check) | Auto | |
| B5 | Upload 8 MB image | Rejected (5 MB limit) | Manual | |
| B6 | Future recycling date | Rejected | Manual | |
| B7 | Filter and search on My Activities | Results update | Manual | |

## C. Verification
| # | Test | Expected | Type | Result |
|---|---|---|---|---|
| C1 | Approve pending submission | Status APPROVED, citizen notified | Auto + Manual | |
| C2 | Approve the same submission again | 409 | Auto | |
| C3 | Reject without reason | 400 | Auto | |
| C4 | Reject with reason | Citizen sees the reason | Manual | |
| C5 | Reject after approval | 409 | Auto | |
| C6 | Evidence image visible to admin, not to logged-out users | Image shows only when logged in | Manual | |

## D. Smart contract (Remix unit tests)
| # | Test | Expected | Type | Result |
|---|---|---|---|---|
| D1 | Default rates 10/8/7/12 | Match | Remix | |
| D2 | 2.5 kg plastic reward | Mints exactly 25 ECO | Remix | |
| D3 | Reward same submission twice | Reverts "Submission already rewarded" | Remix | |
| D4 | Category 4 | Reverts | Remix | |
| D5 | 0 grams, and above max | Revert | Remix | |
| D6 | Zero-address citizen | Reverts | Remix | |
| D7 | Non-admin calls reward / setRate / pause | Revert | Remix | |
| D8 | Pause blocks rewards; unpause restores | As described | Remix | |

## E. Rewards end to end (Sepolia)
| # | Test | Expected | Type | Result |
|---|---|---|---|---|
| E1 | Reward when citizen has no wallet | Button disabled and warning | Auto + Manual | |
| E2 | Link wallet (sign message) | Wallet shown in profile | Manual | |
| E3 | Link a wallet already used by another account | 409 | Manual | |
| E4 | Authorise reward | MetaMask opens, tx hash saved, status PROCESSING then CONFIRMED | Manual | |
| E5 | Citizen dashboard | Reward, tx link and balance appear | Manual | |
| E6 | Record a second reward for same submission | 409 from API | Auto | |
| E7 | Try again after confirmed | Blocked by UI / API / contract | Manual | |
| E8 | Admin wallet that lacks the role | UI shows "not an authorised reward admin" | Manual | |
| E9 | Wrong network in MetaMask | Prompt to switch to Sepolia | Manual | |
| E10 | Reject the MetaMask popup | Friendly message, nothing recorded | Manual | |
| E11 | Reward with failed/dropped tx | Marked FAILED, retry allowed | Manual | |

## F. Privacy
| # | Test | Expected | Type | Result |
|---|---|---|---|---|
| F1 | Leaderboard response fields | Only rank, display name, kg, tokens | Auto | |
| F2 | Citizen API responses | No password hash anywhere | Auto | |

## G. Responsiveness
Check public site, citizen dashboard and admin dashboard at phone (375 px), tablet (768 px), desktop (1280 px). Sidebar collapses on phone; tables scroll; charts resize.

## Known gap to test and record honestly
The browser sends the reward transaction first and the hash to the server second. If the connection drops between the two, the transaction exists on-chain but is not recorded. Recovery: the **Blockchain Records** page and the contract's `isRewarded` check show it; document how you would handle it (future work: server-side event indexer).
