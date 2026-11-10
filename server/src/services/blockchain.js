const { ethers } = require('ethers');
const env = require('../config/env');

// Only the event we need. The backend NEVER holds a private key: administrators sign reward
// transactions in their own MetaMask. The backend only reads the blockchain to confirm what happened.
const iface = new ethers.Interface([
  'event RewardIssued(bytes32 indexed submissionId, address indexed citizen, uint8 category, uint256 grams, uint256 amount)',
]);

let provider = null;
function getProvider() {
  if (!env.SEPOLIA_RPC_URL) return null;
  if (!provider) {
    const network = ethers.Network.from(env.CHAIN_ID);
    provider = new ethers.JsonRpcProvider(env.SEPOLIA_RPC_URL, network, { staticNetwork: network });
  }
  return provider;
}

// The on-chain id is the hash of the database id, so no personal data is stored on-chain.
function onchainSubmissionId(submissionId) {
  return ethers.id(submissionId); // keccak256(utf8 bytes)
}

/**
 * Check a reward transaction against what we expected.
 * expected = { onchainId, citizen, categoryIndex, grams }
 * Returns { state: 'PENDING' | 'CONFIRMED' | 'FAILED', amount?, reason? }
 *  - PENDING   : not mined yet, or we cannot reach the blockchain right now (try again later)
 *  - CONFIRMED : mined, from our contract, and the RewardIssued event matches exactly
 *  - FAILED    : reverted, wrong contract, or no matching event
 */
async function verifyRewardTx(txHash, expected) {
  const rpc = getProvider();
  if (!rpc) return { state: 'PENDING', reason: 'SEPOLIA_RPC_URL is not configured on the server' };
  if (!env.CONTRACT_ADDRESS) return { state: 'PENDING', reason: 'CONTRACT_ADDRESS is not configured on the server' };

  let receipt;
  try {
    receipt = await rpc.getTransactionReceipt(txHash);
  } catch (err) {
    return { state: 'PENDING', reason: `Could not reach the blockchain: ${err.shortMessage || err.message}` };
  }

  if (!receipt) return { state: 'PENDING', reason: 'Transaction not mined yet' };
  if (receipt.status !== 1) return { state: 'FAILED', reason: 'Transaction reverted on-chain' };

  const contract = env.CONTRACT_ADDRESS.toLowerCase();
  if ((receipt.to || '').toLowerCase() !== contract) {
    return { state: 'FAILED', reason: 'Transaction was not sent to the EcoChain contract' };
  }

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== contract) continue;
    let parsed;
    try {
      parsed = iface.parseLog(log);
    } catch {
      continue;
    }
    if (!parsed || parsed.name !== 'RewardIssued') continue;
    const a = parsed.args;
    const matches =
      a.submissionId.toLowerCase() === expected.onchainId.toLowerCase() &&
      a.citizen.toLowerCase() === expected.citizen.toLowerCase() &&
      Number(a.category) === expected.categoryIndex &&
      a.grams === BigInt(expected.grams);
    if (matches) return { state: 'CONFIRMED', amount: ethers.formatUnits(a.amount, 18) };
  }

  return { state: 'FAILED', reason: 'No matching RewardIssued event found in this transaction' };
}

module.exports = { verifyRewardTx, onchainSubmissionId };
