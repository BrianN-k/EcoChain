// Creates (or promotes) an administrator account from the command line.
// There is NO default admin and no admin sign-up page: you run this script yourself.
//
// PowerShell usage (from the server folder):
//   node scripts/createAdmin.js "Admin Name" admin@example.com "StrongPass123"
//
// Tip: after the first login, change the password on the Profile page.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const [fullName, emailRaw, password] = process.argv.slice(2);
  if (!fullName || !emailRaw || !password) {
    console.log('Usage: node scripts/createAdmin.js "Full Name" email@example.com "Password"');
    process.exit(1);
  }
  const email = emailRaw.trim().toLowerCase();
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    console.log('Password must be at least 8 characters and contain a letter and a number.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'ADMIN', passwordHash, accountStatus: 'ACTIVE', fullName },
      create: { fullName, displayName: fullName.split(' ')[0], email, passwordHash, role: 'ADMIN' },
    });
    await prisma.auditLog.create({
      data: { actorId: null, action: 'CREATE_ADMIN', entityType: 'User', entityId: user.id },
    });
    console.log(`Administrator ready: ${user.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
