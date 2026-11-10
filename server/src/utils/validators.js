const { z } = require('zod');
const { CATEGORIES, MAX_KG_PER_SUBMISSION } = require('../config/constants');

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

const walletAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address');
const txHash = z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash');

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(80),
  displayName: z.string().trim().min(2, 'Display name must be at least 2 characters').max(30).optional(),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password,
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

// multipart form fields arrive as strings, so quantity is coerced to a number.
const submissionSchema = z.object({
  wasteCategory: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Choose a valid waste category' }) }),
  quantityKg: z.coerce
    .number({ invalid_type_error: 'Quantity must be a number' })
    .positive('Quantity must be greater than 0')
    .max(MAX_KG_PER_SUBMISSION, `Quantity cannot exceed ${MAX_KG_PER_SUBMISSION} kg`)
    .refine((n) => Math.round(n * 1000) >= 1, 'Quantity must be at least 0.001 kg'),
  collectionLocation: z.string().trim().min(3, 'Enter the collection location').max(200),
  recyclingDate: z.coerce.date({ invalid_type_error: 'Enter a valid date' }).refine(
    (d) => d.getTime() <= Date.now() + 24 * 3600 * 1000,
    'Recycling date cannot be in the future'
  ),
});

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  displayName: z.string().trim().min(2).max(30).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: password,
});

const walletLinkSchema = z.object({
  address: walletAddress,
  signature: z.string().min(10),
});

const rejectSchema = z.object({
  reason: z.string().trim().min(5, 'Please give a rejection reason (at least 5 characters)').max(500),
});

const approveSchema = z.object({
  comments: z.string().trim().max(500).optional(),
});

const recordRewardSchema = z.object({
  submissionId: z.string().min(1),
  transactionHash: txHash,
});

const ratesSchema = z.object({
  PLASTIC: z.coerce.number().int().min(1).max(1000),
  PAPER: z.coerce.number().int().min(1).max(1000),
  GLASS: z.coerce.number().int().min(1).max(1000),
  METAL: z.coerce.number().int().min(1).max(1000),
});

const citizenStatusSchema = z.object({
  accountStatus: z.enum(['ACTIVE', 'SUSPENDED']),
});

module.exports = {
  registerSchema,
  loginSchema,
  submissionSchema,
  profileSchema,
  changePasswordSchema,
  walletLinkSchema,
  rejectSchema,
  approveSchema,
  recordRewardSchema,
  ratesSchema,
  citizenStatusSchema,
};
