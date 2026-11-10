// Pure reward maths (no dependencies, so it is easy to unit test).
//
// Rule: reward = kilograms x rate (ECO per kg).
// The blockchain works in whole numbers, so quantities are converted to GRAMS first:
//   grams  = round(kg x 1000)
//   tokens = grams x rate / 1000
// The contract computes the same value in 18-decimal units:
//   amount = grams x rate x 1e18 / 1000

function toGrams(kg) {
  return Math.round(Number(kg) * 1000);
}

function estimateTokens(kg, ratePerKg) {
  return (toGrams(kg) * Number(ratePerKg)) / 1000;
}

function roundKg(kg) {
  return Math.round(Number(kg) * 1000) / 1000;
}

module.exports = { toGrams, estimateTokens, roundKg };
