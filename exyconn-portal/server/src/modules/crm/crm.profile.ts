import { Schema } from 'mongoose';
import { badRequest } from '../../utils/errors';
import { isWebAddress } from '../../utils/webAddress';

/**
 * The richer profile a contact and a company carry beyond their name: several labelled email
 * addresses and phone numbers (one of each primary), where they are, how to reach them online,
 * and the lifecycle facts a sales team segments by.
 *
 * The single `email` / `phone` fields stay on the record and always hold the primary value, so
 * everything that already reads them (audiences, unsubscribe, lead conversion, import, the email
 * verifier) keeps working unchanged.
 */

export const LIFECYCLE_STAGES = [
  'SUBSCRIBER',
  'LEAD',
  'MARKETING_QUALIFIED',
  'SALES_QUALIFIED',
  'OPPORTUNITY',
  'CUSTOMER',
  'EVANGELIST',
  'OTHER',
] as const;

const emailPointSchema = new Schema(
  {
    address: { type: String, required: true, lowercase: true, trim: true },
    label: { type: String, default: 'Work', trim: true },
    primary: { type: Boolean, default: false },
  },
  { _id: false },
);

const phonePointSchema = new Schema(
  {
    number: { type: String, required: true, trim: true },
    label: { type: String, default: 'Work', trim: true },
    primary: { type: Boolean, default: false },
  },
  { _id: false },
);

/** Where an account or person is and how to find them online. */
const sharedProfileFields = {
  emails: { type: [emailPointSchema], default: [] },
  phones: { type: [phonePointSchema], default: [] },
  website: { type: String, default: '', trim: true },
  linkedinUrl: { type: String, default: '', trim: true },
  twitterUrl: { type: String, default: '', trim: true },
  address: { type: String, default: '', trim: true },
  city: { type: String, default: '', trim: true },
  country: { type: String, default: '', trim: true },
  /** IANA zone, e.g. Asia/Kolkata — what "their local time" on the profile is worked out from. */
  timezone: { type: String, default: '', trim: true },
  description: { type: String, default: '' },
};

export const contactProfileFields = {
  ...sharedProfileFields,
  /** The person's profile picture, hosted on ImageKit; empty shows their initials. */
  avatarUrl: { type: String, default: '', trim: true },
  department: { type: String, default: '', trim: true },
  lifecycleStage: { type: String, enum: LIFECYCLE_STAGES, default: 'LEAD' },
  leadSource: { type: String, default: '', trim: true },
  languages: { type: [String], default: [] },
};

export const companyProfileFields = {
  ...sharedProfileFields,
  /** The company's logo, hosted on ImageKit; empty shows its initials. */
  logoUrl: { type: String, default: '', trim: true },
  annualRevenue: { type: Number, default: null },
  employeeCount: { type: Number, default: null },
  foundedYear: { type: Number, default: null },
};

interface EmailPoint {
  address: string;
  label?: string | null;
  primary?: boolean | null;
}
interface PhonePoint {
  number: string;
  label?: string | null;
  primary?: boolean | null;
}

/** Drops blanks and repeats, and makes exactly one entry primary (the first, if none was chosen). */
function tidy<T extends { primary?: boolean | null }>(points: T[], keyOf: (p: T) => string): T[] {
  const seen = new Set<string>();
  const kept = points.filter((point) => {
    const key = keyOf(point);
    if (key === '' || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
  const primaryAt = Math.max(
    kept.findIndex((point) => point.primary === true),
    0,
  );
  return kept.map((point, index) => ({ ...point, primary: index === primaryAt }));
}

const emailKey = (p: EmailPoint) => p.address.trim().toLowerCase();
const phoneKey = (p: PhonePoint) => p.number.trim();

export interface PointsInput {
  email?: string | null;
  phone?: string | null;
  emails?: EmailPoint[] | null;
  phones?: PhonePoint[] | null;
}

/**
 * The lists as saved, with the single fields set to their primaries. A caller that still sends
 * only `email` / `phone` (an older client, an import, a lead conversion) gets a one-entry list.
 */
export function withPrimaries<T extends PointsInput>(input: T, emailRequired: boolean): T {
  const emails = tidy(
    input.emails ?? (input.email ? [{ address: input.email, label: 'Work', primary: true }] : []),
    emailKey,
  ).map((p) => ({ ...p, address: emailKey(p) }));
  const phones = tidy(
    input.phones ?? (input.phone ? [{ number: input.phone, label: 'Work', primary: true }] : []),
    phoneKey,
  );
  if (emailRequired && emails.length === 0) {
    badRequest('Add at least one email address.');
  }
  return {
    ...input,
    emails,
    phones,
    email: emails.find((p) => p.primary)?.address ?? '',
    phone: phones.find((p) => p.primary)?.number ?? '',
  };
}

/** The pictures a contact or company may carry: blank, or an http(s) address. */
export function assertPictures(input: { logoUrl?: string | null; avatarUrl?: string | null }) {
  for (const url of [input.logoUrl, input.avatarUrl]) {
    if (url && !isWebAddress(url.trim())) {
      badRequest('A picture must be a web address (http or https). Upload it again.');
    }
  }
}

type Row = Record<string, unknown> & { email?: string | null; phone?: string | null };

/** A record saved before the lists existed shows its one email or phone as the primary. */
const emailsOf = (row: Row) => {
  const list = row.emails as EmailPoint[] | undefined;
  if (list?.length) return list;
  return row.email ? [{ address: row.email, label: 'Work', primary: true }] : [];
};
const phonesOf = (row: Row) => {
  const list = row.phones as PhonePoint[] | undefined;
  if (list?.length) return list;
  return row.phone ? [{ number: row.phone, label: 'Work', primary: true }] : [];
};

/** `.lean()` rows written before a field existed come back without it. */
const text = (field: string) => (row: Row) => (row[field] as string | undefined) ?? '';
const numberOrNull = (field: string) => (row: Row) => (row[field] as number | undefined) ?? null;

const sharedResolvers = {
  emails: emailsOf,
  phones: phonesOf,
  website: text('website'),
  linkedinUrl: text('linkedinUrl'),
  twitterUrl: text('twitterUrl'),
  address: text('address'),
  city: text('city'),
  country: text('country'),
  timezone: text('timezone'),
  description: text('description'),
};

export const crmProfileResolvers = {
  Contact: {
    ...sharedResolvers,
    avatarUrl: text('avatarUrl'),
    department: text('department'),
    lifecycleStage: (row: Row) => (row.lifecycleStage as string | undefined) ?? 'LEAD',
    leadSource: text('leadSource'),
    languages: (row: Row) => (row.languages as string[] | undefined) ?? [],
  },
  Company: {
    ...sharedResolvers,
    email: (row: Row) => emailsOf(row).find((p) => p.primary)?.address ?? '',
    logoUrl: text('logoUrl'),
    annualRevenue: numberOrNull('annualRevenue'),
    employeeCount: numberOrNull('employeeCount'),
    foundedYear: numberOrNull('foundedYear'),
  },
};
