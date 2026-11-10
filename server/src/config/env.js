require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy server/.env.example to server/.env and fill it in.`
    );
  }
  return value;
}

const JWT_SECRET = required('JWT_SECRET');
if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
}

module.exports = {
  PORT: Number(process.env.PORT || 3001),
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL || '',
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '',
  CHAIN_ID: Number(process.env.CHAIN_ID || 11155111),
  EXPLORER_BASE_URL: process.env.EXPLORER_BASE_URL || 'https://sepolia.etherscan.io',
};
