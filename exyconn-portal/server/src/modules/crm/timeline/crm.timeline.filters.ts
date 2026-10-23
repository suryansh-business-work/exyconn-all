import type { TimelineTarget } from './crm.timeline.types';

/**
 * What makes a record belong to the target's timeline, per source: a CRM link (activities,
 * deals) or one of the target's email addresses. The timeline lists by these and the
 * details of one entry are read by them too, so an entry opens only on its own record's page.
 */
export const belongsTo = {
  activity: ({ contactIds, companyId }: TimelineTarget) => ({
    relatedId: { $in: [...contactIds, companyId].filter(Boolean) },
  }),
  deal: ({ contactIds, companyId }: TimelineTarget) => ({
    $or: [{ contactId: { $in: contactIds } }, ...(companyId ? [{ companyId }] : [])],
  }),
  lead: ({ addresses }: TimelineTarget) => ({ email: { $in: addresses } }),
  submission: ({ addresses }: TimelineTarget) => ({
    'submissionData.email': { $in: addresses },
  }),
  emailLog: ({ addresses }: TimelineTarget) => ({ to: { $in: addresses } }),
  whatsapp: ({ addresses }: TimelineTarget) => ({ email: { $in: addresses } }),
  gmail: ({ addresses }: TimelineTarget) => ({ participants: { $in: addresses } }),
};
