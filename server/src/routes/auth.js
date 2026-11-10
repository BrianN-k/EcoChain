const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const prisma = require('../config/prisma');
const { asyncHandler, HttpError } = require('../utils/errors');
const { validate } = require('../middleware/validate');
const { requireAuth, signToken, publicUser } = require('../middleware/auth');
const { registerSchema, loginSchema, changePasswordSchema } = require('../utils/validators');

const router = express.Router();

// Slow down password guessing (max 20 attempts per 15 minutes per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
});

// Registration ALWAYS creates a CITIZEN. The role is never read from the request,
// so nobody can register themselves as an administrator.
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { fullName, displayName, email, password } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new HttpError(409, 'An account with this email already exists');

    const user = await prisma.user.create({
      data: {
        fullName,
        displayName: displayName || fullName.split(' ')[0],
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: 'CITIZEN',
      },
    });
    await prisma.notification.create({
      data: { userId: user.id, title: 'Welcome to EcoChain', message: 'Link your MetaMask wallet to start receiving ECO rewards.' },
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  })
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    // Same message for "no such user" and "wrong password" so emails cannot be probed.
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) throw new HttpError(401, 'Incorrect email or password');
    if (user.accountStatus !== 'ACTIVE') throw new HttpError(403, 'This account has been suspended');
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const ok = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!ok) throw new HttpError(400, 'Current password is incorrect');
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });
    res.json({ message: 'Password updated' });
  })
);

module.exports = router;
