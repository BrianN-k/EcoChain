const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../config/prisma');
const { HttpError, asyncHandler } = require('../utils/errors');

// Verifies the Bearer token AND re-loads the user on every request,
// so suspended accounts and role changes take effect immediately.
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Session expired. Please log in again.');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new HttpError(401, 'Account not found');
  if (user.accountStatus !== 'ACTIVE') throw new HttpError(403, 'This account has been suspended');

  req.user = user;
  next();
});

// Role check. Always used AFTER requireAuth.
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new HttpError(403, 'You do not have permission to perform this action'));
  }
  next();
};

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

// Never send the password hash to the browser.
function publicUser(u) {
  return {
    id: u.id,
    fullName: u.fullName,
    displayName: u.displayName,
    email: u.email,
    role: u.role,
    walletAddress: u.walletAddress,
    accountStatus: u.accountStatus,
    isDemo: u.isDemo,
    createdAt: u.createdAt,
  };
}

module.exports = { requireAuth, requireRole, signToken, publicUser };
