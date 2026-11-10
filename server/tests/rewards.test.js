// Pure-logic tests. These need NO npm packages:   node --test tests/rewards.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { toGrams, estimateTokens, roundKg } = require('../src/utils/rewards');

test('kg converts to whole grams', () => {
  assert.equal(toGrams(1), 1000);
  assert.equal(toGrams(2.5), 2500);
  assert.equal(toGrams(0.001), 1);
  assert.equal(toGrams(0.1 + 0.2), 300); // floating-point safe
});

test('reward formula matches the contract: grams x rate / 1000', () => {
  assert.equal(estimateTokens(5, 10), 50); // plastic 10/kg
  assert.equal(estimateTokens(5, 8), 40); // paper 8/kg
  assert.equal(estimateTokens(5, 7), 35); // glass 7/kg
  assert.equal(estimateTokens(5, 12), 60); // metal 12/kg
  assert.equal(estimateTokens(2.5, 12), 30);
  assert.equal(estimateTokens(0.001, 10), 0.01);
});

test('roundKg keeps three decimals', () => {
  assert.equal(roundKg(1.23456), 1.235);
});
