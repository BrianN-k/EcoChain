const prisma = require('../config/prisma');
const { CATEGORIES, DEFAULT_RATES } = require('../config/constants');

// Reward rates (ECO per kg) live in the Setting table under the key "rates".
// IMPORTANT: the smart contract keeps its own rates. These database values are used for
// estimates in the UI; the contract's rates decide what is actually minted.
async function getRates() {
  const row = await prisma.setting.findUnique({ where: { key: 'rates' } });
  if (!row) return { ...DEFAULT_RATES };
  try {
    const parsed = JSON.parse(row.value);
    const rates = {};
    for (const c of CATEGORIES) rates[c] = Number(parsed[c] ?? DEFAULT_RATES[c]);
    return rates;
  } catch {
    return { ...DEFAULT_RATES };
  }
}

async function saveRates(rates) {
  await prisma.setting.upsert({
    where: { key: 'rates' },
    update: { value: JSON.stringify(rates) },
    create: { key: 'rates', value: JSON.stringify(rates) },
  });
}

module.exports = { getRates, saveRates };
