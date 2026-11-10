// End-to-end API tests (run on YOUR machine after `npm install` and `npm run db:push`).
//   npm test
// They start the Express app on a random port against a throw-away SQLite file,
// so your real dev.db is never touched.
const path = require('path');
const fs = require('fs');
const os = require('os');

const dbFile = path.join(os.tmpdir(), `ecochain-test-${Date.now()}.db`);
process.env.DATABASE_URL = `file:${dbFile.replace(/\\/g, '/')}`; // forward slashes also on Windows
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123456';
process.env.CONTRACT_ADDRESS = '';
process.env.SEPOLIA_RPC_URL = '';

const { execSync } = require('child_process');
execSync('npx prisma db push --skip-generate --schema prisma/schema.prisma', {
  cwd: path.join(__dirname, '..'),
  env: process.env,
  stdio: 'ignore',
});

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');
const app = require('../src/app');

let server;
let base;
const WALLET = '0x' + 'a'.repeat(40);

async function call(method, url, { token, body } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json };
}

test.before(async () => {
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
  await prisma.user.create({
    data: {
      fullName: 'Test Admin',
      displayName: 'Admin',
      email: 'admin@test.com',
      passwordHash: await bcrypt.hash('Admin12345', 4),
      role: 'ADMIN',
    },
  });
});

test.after(async () => {
  server.close();
  await prisma.$disconnect();
  fs.rmSync(dbFile, { force: true });
});

let citizenToken, adminToken, submissionId;

test('registration creates a CITIZEN and ignores a role sent by the client', async () => {
  const r = await call('POST', '/api/auth/register', {
    body: { fullName: 'Test Citizen', email: 'c@test.com', password: 'Citizen123', role: 'ADMIN' },
  });
  assert.equal(r.status, 201);
  assert.equal(r.json.user.role, 'CITIZEN');
  assert.equal(r.json.user.passwordHash, undefined);
  citizenToken = r.json.token;
});

test('weak passwords and duplicate emails are rejected', async () => {
  const weak = await call('POST', '/api/auth/register', {
    body: { fullName: 'X Y', email: 'weak@test.com', password: 'short' },
  });
  assert.equal(weak.status, 400);
  const dup = await call('POST', '/api/auth/register', {
    body: { fullName: 'Test Citizen', email: 'c@test.com', password: 'Citizen123' },
  });
  assert.equal(dup.status, 409);
});

test('login works and wrong password fails', async () => {
  const bad = await call('POST', '/api/auth/login', { body: { email: 'admin@test.com', password: 'nope12345' } });
  assert.equal(bad.status, 401);
  const ok = await call('POST', '/api/auth/login', { body: { email: 'admin@test.com', password: 'Admin12345' } });
  assert.equal(ok.status, 200);
  adminToken = ok.json.token;
});

test('citizens cannot reach admin API, anonymous users cannot reach anything', async () => {
  assert.equal((await call('GET', '/api/admin/overview', { token: citizenToken })).status, 403);
  assert.equal((await call('GET', '/api/admin/overview')).status, 401);
  assert.equal((await call('GET', '/api/citizen/overview')).status, 401);
  assert.equal((await call('GET', '/api/citizen/overview', { token: adminToken })).status, 403);
});

test('submission validation rejects bad quantities and categories', async () => {
  const form = (fields) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    return fetch(base + '/api/citizen/submissions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: fd,
    });
  };
  const good = { wasteCategory: 'PLASTIC', quantityKg: '5', collectionLocation: 'Nairobi', recyclingDate: '2026-01-01' };
  assert.equal((await form({ ...good, quantityKg: '-3' })).status, 400);
  assert.equal((await form({ ...good, quantityKg: '0' })).status, 400);
  assert.equal((await form({ ...good, quantityKg: '99999' })).status, 400);
  assert.equal((await form({ ...good, wasteCategory: 'GOLD' })).status, 400);
  const ok = await form(good);
  assert.equal(ok.status, 201);
  const json = await ok.json();
  assert.equal(json.submission.status, 'PENDING');
  submissionId = json.submission.id;
});

test('a fake image upload is rejected', async () => {
  const fd = new FormData();
  fd.append('wasteCategory', 'PAPER');
  fd.append('quantityKg', '2');
  fd.append('collectionLocation', 'Nairobi');
  fd.append('recyclingDate', '2026-01-01');
  fd.append('evidence', new Blob(['<?php echo 1; ?>'], { type: 'image/png' }), 'evil.png');
  const res = await fetch(base + '/api/citizen/submissions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: fd,
  });
  assert.equal(res.status, 400);
});

test('rejection needs a reason; approval works once only', async () => {
  const noReason = await call('POST', `/api/admin/submissions/${submissionId}/reject`, { token: adminToken, body: {} });
  assert.equal(noReason.status, 400);
  const ok = await call('POST', `/api/admin/submissions/${submissionId}/approve`, { token: adminToken, body: {} });
  assert.equal(ok.status, 200);
  const again = await call('POST', `/api/admin/submissions/${submissionId}/approve`, { token: adminToken, body: {} });
  assert.equal(again.status, 409);
  const rejectAfter = await call('POST', `/api/admin/submissions/${submissionId}/reject`, {
    token: adminToken,
    body: { reason: 'Too late to reject' },
  });
  assert.equal(rejectAfter.status, 409);
});

test('reward cannot be recorded until the citizen has a linked wallet', async () => {
  const r = await call('POST', '/api/admin/rewards', {
    token: adminToken,
    body: { submissionId, transactionHash: '0x' + 'b'.repeat(64) },
  });
  assert.equal(r.status, 409);
});

test('duplicate reward protection: second record for the same submission is refused', async () => {
  // Link a wallet directly in the database (the signature flow needs MetaMask).
  await prisma.user.update({ where: { email: 'c@test.com' }, data: { walletAddress: WALLET } });
  const first = await call('POST', '/api/admin/rewards', {
    token: adminToken,
    body: { submissionId, transactionHash: '0x' + 'b'.repeat(64) },
  });
  assert.equal(first.status, 201);
  assert.equal(first.json.reward.transactionStatus, 'PROCESSING'); // RPC not configured -> stays pending
  const second = await call('POST', '/api/admin/rewards', {
    token: adminToken,
    body: { submissionId, transactionHash: '0x' + 'c'.repeat(64) },
  });
  assert.equal(second.status, 409);
  assert.equal(await prisma.reward.count({ where: { submissionId } }), 1);
});

test('leaderboard hides private data', async () => {
  const r = await call('GET', '/api/leaderboard', { token: citizenToken });
  assert.equal(r.status, 200);
  const row = r.json.leaderboard[0];
  assert.deepEqual(Object.keys(row).sort(), ['displayName', 'isYou', 'rank', 'tokensEarned', 'verifiedKg']);
});

test('admin cannot be created through the public API', async () => {
  const r = await call('POST', '/api/auth/register', {
    body: { fullName: 'Sneaky', email: 's@test.com', password: 'Sneaky1234', role: 'ADMIN' },
  });
  assert.equal(r.json.user.role, 'CITIZEN');
});
