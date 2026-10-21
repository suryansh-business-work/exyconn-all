import { ContactModel } from '../contact.model';
import { CompanyModel } from '../company.model';
import { assertPermission } from '../../../lib/permissions';
import { ROLES } from '../../../constants/roles';
import { notFound } from '../../../utils/errors';
import type { GraphQLContext } from '../../../middleware/auth';
import { TIMELINE_SOURCES } from './crm.timeline.sources';
import type { TimelineItem, TimelineTarget } from './crm.timeline.types';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

type Addressed = { email?: string | null; emails?: Array<{ address: string }> | null };

/** Every address of a record, lower-cased, the primary included even on an old record. */
const addressesOf = (row: Addressed): string[] =>
  [row.email ?? '', ...(row.emails ?? []).map((point) => point.address)]
    .map((address) => address.trim().toLowerCase())
    .filter(Boolean);

async function contactTarget(id: string, limit: number): Promise<TimelineTarget> {
  const contact = await ContactModel.findById(id).select('email emails').lean<Addressed>();
  if (!contact) notFound('Contact');
  return {
    addresses: [...new Set(addressesOf(contact))],
    contactIds: [id],
    companyId: '',
    recordPath: `/contacts/${id}`,
    limit,
  };
}

/** A company's own addresses and every address of the people at it. */
async function companyTarget(id: string, limit: number): Promise<TimelineTarget> {
  const company = await CompanyModel.findById(id).select('emails').lean<Addressed>();
  if (!company) notFound('Company');
  const people = await ContactModel.find({ companyId: id })
    .select('email emails')
    .lean<Array<Addressed & { _id: unknown }>>();
  const addresses = [...addressesOf(company), ...people.flatMap(addressesOf)];
  return {
    addresses: [...new Set(addresses)],
    contactIds: people.map((person) => String(person._id)),
    companyId: id,
    recordPath: `/companies/${id}`,
    limit,
  };
}

/**
 * Everything that happened with a contact or company, newest first: CRM activities and deals,
 * and — matched by email — website forms, chats, support tickets, leads, campaigns, system
 * emails and WhatsApp demo sign-ups. Nothing is copied; each module stays the source.
 */
/** Who a contact's or company's page is about: their addresses and CRM records. */
export const timelineTarget = (object: 'CONTACT' | 'COMPANY', id: string, limit: number) =>
  object === 'CONTACT' ? contactTarget(id, limit) : companyTarget(id, limit);

export async function crmTimeline(
  object: 'CONTACT' | 'COMPANY',
  id: string,
  requested: number | null | undefined,
): Promise<TimelineItem[]> {
  const limit = Math.min(Math.max(requested ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const target =
    object === 'CONTACT' ? await contactTarget(id, limit) : await companyTarget(id, limit);
  const lists = await Promise.all(TIMELINE_SOURCES.map((read) => read(target)));
  return lists
    .flat()
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit);
}

export const crmTimelineResolvers = {
  Query: {
    crmTimeline: async (
      _p: unknown,
      args: { object: 'CONTACT' | 'COMPANY'; id: string; limit?: number | null },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(
        ctx,
        args.object === 'CONTACT' ? 'Contact' : 'Company',
        [ROLES.CRM],
        'VIEW',
      );
      return crmTimeline(args.object, args.id, args.limit);
    },
  },
};
