import {
  REFUND_METHODS,
  SALARY_METHODS,
  SECRET_FIELDS,
  emptyPayout,
  normalizePayout,
  onlyAskedFields,
  payoutIssues,
  payoutSummary,
  secretHint,
  type PayoutDetails,
  type PayoutMethod,
  type SecretField,
} from '@exyconn/payout';
import { badRequest, notFound } from '../../utils/errors';
import { isValidCountry, isValidCurrency } from '../../utils/iso';
import { open, seal } from '../../utils/secretBox';
import { withId, withIds } from '../../utils/serialize';
import { PayoutAccountModel, type PayoutOwnerType } from './payout-account.model';

export interface PayoutOwner {
  type: PayoutOwnerType;
  id: string;
}

export type PayoutAccountInput = Omit<PayoutDetails, 'accountType'> & {
  accountType?: PayoutDetails['accountType'] | null;
  isPrimary?: boolean | null;
};

/** Salary goes to a bank or UPI; a refund may go back by any method. */
const METHODS: Readonly<Record<PayoutOwnerType, ReadonlySet<PayoutMethod>>> = {
  EMPLOYEE: new Set(SALARY_METHODS),
  CLIENT: new Set(REFUND_METHODS),
};

const SECRET_SELECT = SECRET_FIELDS.map((field) => `+${field}`).join(' ');

const ownerFilter = (owner: PayoutOwner) => ({ ownerType: owner.type, ownerId: owner.id });

async function findOwn(owner: PayoutOwner, id: string, select = '') {
  const row = await PayoutAccountModel.findOne({ _id: id, ...ownerFilter(owner) }).select(select);
  return row ?? notFound('Payout account');
}

/** Only the payout details from the input: nothing else (isPrimary, stray keys) is stored. */
function detailsOf(input: PayoutAccountInput): PayoutDetails {
  const details = emptyPayout(input.method, input.country, input.currency);
  for (const key of Object.keys(details) as (keyof PayoutDetails)[]) {
    const value = input[key];
    if (typeof value === 'string') {
      (details as unknown as Record<string, string>)[key] = value;
    }
  }
  return details;
}

/** The details to check and store: typed secrets, else the ones already sealed on the row. */
function mergeStored(input: PayoutAccountInput, stored: Record<string, unknown> | null) {
  const details = normalizePayout(detailsOf(input));
  for (const field of SECRET_FIELDS) {
    const sealed = stored?.[field];
    if (details[field] === '' && typeof sealed === 'string' && sealed !== '') {
      details[field] = open(sealed);
    }
  }
  return onlyAskedFields(details);
}

function assertValid(owner: PayoutOwner, details: PayoutDetails): void {
  if (!METHODS[owner.type].has(details.method)) {
    badRequest('That payout method is not offered for this account.');
  }
  if (!isValidCountry(details.country)) {
    badRequest('Choose the country the account is in.');
  }
  if (!isValidCurrency(details.currency)) {
    badRequest('Choose the currency the account is paid in.');
  }
  const [issue] = payoutIssues(details);
  if (issue) {
    badRequest(issue.message);
  }
}

/** The row as stored: plain details, sealed secrets with their hints, and the summary line. */
function toStored(details: PayoutDetails) {
  const secrets: Record<string, string> = {};
  const hints: Record<string, string> = {};
  for (const field of SECRET_FIELDS) {
    secrets[field] = details[field] ? seal(details[field]) : '';
    hints[field] = secretHint(field, details[field]);
  }
  return { ...details, ...secrets, hints, summary: payoutSummary(details) };
}

/** Makes `id` the owner's only primary account. Others are cleared first: the index allows one. */
async function makePrimary(owner: PayoutOwner, id: unknown) {
  await PayoutAccountModel.updateMany(
    { ...ownerFilter(owner), _id: { $ne: id }, isPrimary: true },
    { isPrimary: false },
  );
  await PayoutAccountModel.updateOne({ _id: id }, { isPrimary: true });
}

export const payoutService = {
  /** The owner's accounts, primary first, then oldest first. No secret is read. */
  async list(owner: PayoutOwner) {
    const rows = await PayoutAccountModel.find(ownerFilter(owner))
      .sort({ isPrimary: -1, createdAt: 1 })
      .lean();
    return withIds(rows);
  },

  /** Creates (no `id`) or replaces one account. A blank secret on an edit keeps the stored one. */
  async save(owner: PayoutOwner, id: string | null, input: PayoutAccountInput) {
    const existing = id ? await findOwn(owner, id, SECRET_SELECT) : null;
    const details = mergeStored(input, existing?.toObject() ?? null);
    assertValid(owner, details);
    const values = toStored(details);
    const saved = existing
      ? await PayoutAccountModel.findByIdAndUpdate(existing._id, values, { new: true })
      : await PayoutAccountModel.create({ ...values, ...ownerFilter(owner) });
    if (!saved) {
      return notFound('Payout account');
    }
    const isFirst = (await PayoutAccountModel.countDocuments(ownerFilter(owner))) === 1;
    if (input.isPrimary || isFirst) {
      await makePrimary(owner, saved._id);
    }
    const row = await PayoutAccountModel.findById(saved._id).lean();
    return { before: existing?.toObject() ?? null, account: withId(row ?? saved.toObject()) };
  },

  /** Removes one account; when it was the primary, the oldest remaining one takes over. */
  async remove(owner: PayoutOwner, id: string) {
    const row = await findOwn(owner, id);
    await PayoutAccountModel.deleteOne({ _id: row._id });
    if (row.isPrimary) {
      const next = await PayoutAccountModel.findOne(ownerFilter(owner)).sort({ createdAt: 1 });
      if (next) {
        await makePrimary(owner, next._id);
      }
    }
    return row.toObject();
  },

  /** One sealed value in full, for whoever is allowed to pay it. Callers log the reveal. */
  async reveal(owner: PayoutOwner, id: string, field: SecretField) {
    const row = await findOwn(owner, id, `+${field}`);
    const sealed = row.get(field) as string;
    if (!sealed) {
      notFound('That detail');
    }
    return { summary: row.summary, value: open(sealed) };
  },
};
