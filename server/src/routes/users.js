const express = require('express');
const crypto = require('crypto');
const { ethers } = require('ethers');
const prisma = require('../config/prisma');
const { asyncHandler, HttpError } = require('../utils/errors');
const { validate } = require('../middleware/validate');
const { requireAuth, publicUser } = require('../middleware/auth');
const { profileSchema, walletLinkSchema } = require('../utils/validators');

const router = express.Router();
router.use(requireAuth);

router.patch(
  '/me',
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({ where: { id: req.user.id }, data: req.body });
    res.json({ user: publicUser(user) });
  })
);

// --- Wallet linking with proof of ownership --------------------------------
// 1. The browser asks for a one-time message (nonce).
// 2. The user signs it in MetaMask (this is a free signature, NOT a transaction).
// 3. We recover the signer from the signature and compare it with the claimed address.
const nonces = new Map(); // userId -> { nonce, expires }  (in memory: fine for one server)

function buildMessage(nonce) {
  return `Link this wallet to my EcoChain account.\nNonce: ${nonce}`;
}

router.get('/me/wallet-nonce', (req, res) => {
  const nonce = crypto.randomBytes(16).toString('hex');
  nonces.set(req.user.id, { nonce, expires: Date.now() + 5 * 60 * 1000 });
  res.json({ message: buildMessage(nonce) });
});

router.post(
  '/me/wallet',
  validate(walletLinkSchema),
  asyncHandler(async (req, res) => {
    const entry = nonces.get(req.user.id);
    if (!entry || entry.expires < Date.now()) throw new HttpError(400, 'Wallet link request expired. Try again.');

    let signer;
    try {
      signer = ethers.verifyMessage(buildMessage(entry.nonce), req.body.signature);
    } catch {
      throw new HttpError(400, 'Invalid signature');
    }
    if (signer.toLowerCase() !== req.body.address.toLowerCase()) {
      throw new HttpError(400, 'Signature does not match the wallet address');
    }
    nonces.delete(req.user.id); // one-time use

    const address = ethers.getAddress(signer); // checksummed
    const taken = await prisma.user.findFirst({
      where: { walletAddress: address, NOT: { id: req.user.id } },
    });
    if (taken) throw new HttpError(409, 'This wallet is already linked to another account');

    const user = await prisma.user.update({ where: { id: req.user.id }, data: { walletAddress: address } });
    res.json({ user: publicUser(user) });
  })
);

router.get(
  '/me/notifications',
  asyncHandler(async (req, res) => {
    const items = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json({ notifications: items, unread: items.filter((n) => !n.isRead).length });
  })
);

router.post(
  '/me/notifications/read',
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
    res.json({ ok: true });
  })
);

module.exports = router;
