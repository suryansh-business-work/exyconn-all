import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { BANK_ACCOUNT_TYPES, PAYOUT_METHODS } from '@exyconn/payout';

/** Whose account it is: an employee's salary account, or a client's refund account. */
export const PAYOUT_OWNER_TYPES = ['EMPLOYEE', 'CLIENT'] as const;
export type PayoutOwnerType = (typeof PAYOUT_OWNER_TYPES)[number];

/** A sealed value and nothing else: never selected unless a reveal asks for it by name. */
const sealed = { type: String, default: '', select: false } as const;
const hint = { type: String, default: '' } as const;

/**
 * Where one payee is paid: a bank account, a UPI ID, a wallet or a Western Union receiver.
 * Validated by @exyconn/payout (the same rules as the portal form). Identifiers that move money
 * — account number, IBAN, UPI ID, phone, wallet email — are sealed (utils/secretBox) and kept
 * out of every read; `hints` and `summary` say which account it is without giving it away.
 */
const payoutAccountSchema = new Schema(
  {
    ownerType: { type: String, enum: PAYOUT_OWNER_TYPES, required: true },
    /** The employee's user id, or the client's id. */
    ownerId: { type: String, required: true, trim: true },
    method: { type: String, enum: PAYOUT_METHODS, required: true },
    /** ISO 3166-1 alpha-2. */
    country: { type: String, required: true },
    /** ISO 4217. */
    currency: { type: String, required: true },
    holderName: { type: String, default: '' },
    bankName: { type: String, default: '' },
    branchName: { type: String, default: '' },
    /** ISO 9362. Not secret: it names a bank, not an account. */
    bic: { type: String, default: '' },
    /** IFSC, ABA routing, sort code, BSB or institution + transit. Not secret either. */
    routingCode: { type: String, default: '' },
    accountType: { type: String, enum: ['', ...BANK_ACCOUNT_TYPES], default: '' },
    city: { type: String, default: '' },
    region: { type: String, default: '' },
    accountNumber: sealed,
    iban: sealed,
    upiId: sealed,
    phone: sealed,
    walletEmail: sealed,
    hints: {
      accountNumber: hint,
      iban: hint,
      upiId: hint,
      phone: hint,
      walletEmail: hint,
    },
    /** One masked line naming the account, e.g. `HDFC0001234 · •••• 4321`. */
    summary: { type: String, default: '' },
    /** The account salary or a refund is paid to by default. One per owner. */
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true },
);

payoutAccountSchema.index({ ownerType: 1, ownerId: 1, createdAt: 1 });
// Two primaries would leave payroll guessing; the second save is refused instead.
payoutAccountSchema.index(
  { ownerType: 1, ownerId: 1 },
  { unique: true, partialFilterExpression: { isPrimary: true }, name: 'one_primary_per_owner' },
);

export type PayoutAccountDocument = InferSchemaType<typeof payoutAccountSchema>;
export const PayoutAccountModel: Model<PayoutAccountDocument> = model<PayoutAccountDocument>(
  'PayoutAccount',
  payoutAccountSchema,
);
