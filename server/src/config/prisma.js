const { PrismaClient } = require('@prisma/client');

// One shared client for the whole app.
const prisma = new PrismaClient();

module.exports = prisma;
