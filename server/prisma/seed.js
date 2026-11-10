// Demonstration data for presentations.
//
// RULES FOLLOWED HERE
//  - Every seeded citizen has isDemo = true, so the UI can label the data "Demo data".
//  - NO Reward rows and NO transaction hashes are created. Blockchain records only ever come
//    from real Sepolia transactions, never from the seed.
//  - Demo submissions are PENDING, APPROVED or REJECTED. Rewarding an APPROVED demo
//    submission requires the demo citizen to link a real wallet, so the live demo is: register
//    your own citizen, submit, approve, and reward on Sepolia.
//
// Usage (server folder):  node prisma/seed.js
// Password for demo citizens: set SEED_PASSWORD in .env, otherwise a random one is printed.

require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const NAMES = [
  ['Amina Wanjiru', 'Amina'],
  ['Brian Otieno', 'Brian'],
  ['Cynthia Mwangi', 'Cynthia'],
  ['Daniel Kiptoo', 'Daniel'],
  ['Esther Achieng', 'Esther'],
  ['Felix Mutua', 'Felix'],
];
const CATEGORIES = ['PLASTIC', 'PAPER', 'GLASS', 'METAL'];
const PLACES = ['Nairobi CBD', 'Kilimani', 'Westlands', 'Ruaraka', 'Kasarani', 'Embakasi'];

// Deterministic pseudo-random so the seed gives the same data each time.
let seedState = 42;
function rand() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}

async function main() {
  const existing = await prisma.user.count({ where: { isDemo: true } });
  if (existing > 0) {
    console.log('Demo data already exists. Nothing to do.');
    return;
  }

  const password = process.env.SEED_PASSWORD || crypto.randomBytes(6).toString('hex') + 'A1';
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  for (const [fullName, displayName] of NAMES) {
    const email = `${displayName.toLowerCase()}.demo@ecochain.example`;
    const user = await prisma.user.create({
      data: { fullName, displayName, email, passwordHash, role: 'CITIZEN', isDemo: true },
    });

    const count = 4 + Math.floor(rand() * 5);
    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor(rand() * 150);
      const date = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
      const roll = rand();
      const status = roll < 0.2 ? 'PENDING' : roll < 0.85 ? 'APPROVED' : 'REJECTED';
      const sub = await prisma.recyclingSubmission.create({
        data: {
          citizenId: user.id,
          wasteCategory: CATEGORIES[Math.floor(rand() * 4)],
          quantityKg: Math.round((1 + rand() * 24) * 10) / 10,
          collectionLocation: PLACES[Math.floor(rand() * PLACES.length)],
          recyclingDate: date,
          status,
          rejectionReason: status === 'REJECTED' ? 'Quantity could not be verified from the evidence.' : null,
          createdAt: date,
        },
      });
      if (admin && status !== 'PENDING') {
        await prisma.verification.create({
          data: {
            submissionId: sub.id,
            adminId: admin.id,
            decision: status,
            comments: status === 'REJECTED' ? sub.rejectionReason : 'Demo approval',
            verifiedAt: date,
          },
        });
      }
    }
  }

  console.log('Demo data created.');
  console.log(`Demo citizen logins: <name>.demo@ecochain.example  (e.g. amina.demo@ecochain.example)`);
  console.log(`Demo password: ${password}`);
  if (!admin) console.log('Tip: create an admin first (npm run create-admin) so demo verifications are recorded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
