import { isValidObjectId, Schema } from 'mongoose';
import { UserModel } from '../admin/user.model';
import type { GraphQLContext } from '../../middleware/auth';

/**
 * Who or what brought a company or contact into the CRM — its "lead owner" in the sales
 * desk's words. Kept apart from `owner`, the person who looks after the account: an import or
 * a website enquiry has a creator but nobody looking after it yet.
 */
export const ORIGIN_SOURCES = [
  'USER',
  'WEBSITE',
  'GOOGLE_PLACES',
  'MEETING_BOOKING',
  'LEAD_CONVERSION',
  'CLUTCH',
] as const;
export type OriginSource = (typeof ORIGIN_SOURCES)[number];

export interface RecordOrigin {
  source: OriginSource;
  /** The signed-in person who created it or ran the import; empty for the public website. */
  userId: string;
  userName: string;
  userEmail: string;
}

const originSchema = new Schema(
  {
    source: { type: String, enum: ORIGIN_SOURCES, required: true },
    userId: { type: String, default: '' },
    userName: { type: String, default: '', trim: true },
    userEmail: { type: String, default: '', trim: true, lowercase: true },
  },
  { _id: false },
);

/** Spread into the Company and Contact schemas. */
export const originFields = {
  origin: { type: originSchema, default: null },
  /** The creator's name, or what brought it in ("Website"), stored so the grid can filter it. */
  leadOwner: { type: String, default: '', trim: true, index: true },
};

/** How an origin without a person reads in the "Lead owner" column. */
export const ORIGIN_LABEL: Readonly<Record<OriginSource, string>> = {
  USER: 'Added by hand',
  WEBSITE: 'From website',
  GOOGLE_PLACES: 'Google Places',
  MEETING_BOOKING: 'Meeting booking',
  LEAD_CONVERSION: 'Converted lead',
  CLUTCH: 'Clutch',
};

/** The fields a new record carries for where it came from. */
export const stampOrigin = (origin: RecordOrigin) => ({
  origin,
  leadOwner: origin.userName || ORIGIN_LABEL[origin.source],
});

/** An origin with nobody signed in behind it: the website, a booking link. */
export const systemOrigin = (source: OriginSource): RecordOrigin => ({
  source,
  userId: '',
  userName: '',
  userEmail: '',
});

/** The signed-in caller as the creator of what they are filing. */
export async function userOrigin(ctx: GraphQLContext, source: OriginSource): Promise<RecordOrigin> {
  const id = ctx.user?.id ?? '';
  // A malformed id in a token must degrade to "no name", not fail the record being filed.
  const user = isValidObjectId(id)
    ? await UserModel.findById(id).select('name email').lean()
    : null;
  return {
    source,
    userId: id,
    userName: user?.name ?? '',
    userEmail: user?.email ?? ctx.user?.email ?? '',
  };
}

type Row = { origin?: RecordOrigin | null; leadOwner?: string | null };

/** Rows written before the fields existed come back without them until the boot backfill. */
const resolvers = {
  origin: (row: Row) => row.origin ?? null,
  leadOwner: (row: Row) => row.leadOwner ?? '',
};
export const crmOriginResolvers = { Company: resolvers, Contact: resolvers };
