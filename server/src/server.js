const env = require('./config/env');
const app = require('./app');

app.listen(env.PORT, () => {
  console.log(`EcoChain API running on http://localhost:${env.PORT}`);
  if (!env.CONTRACT_ADDRESS) console.log('Note: CONTRACT_ADDRESS is not set yet (deploy the contract first).');
  if (!env.SEPOLIA_RPC_URL) console.log('Note: SEPOLIA_RPC_URL is not set yet (needed to verify rewards).');
});
