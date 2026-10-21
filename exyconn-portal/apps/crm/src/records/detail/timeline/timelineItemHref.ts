import { appUrl, type PortalAppKey } from '@exyconn/shell/config/apps';
import { CrmTimelineKind } from '@exyconn/shell/graphql/generated';
import type { TimelineRow } from './TimelineEntry';

/** The portal app whose page each kind's `url` path opens in. */
const KIND_APP: Record<CrmTimelineKind, PortalAppKey> = {
  [CrmTimelineKind.Note]: 'crm',
  [CrmTimelineKind.Call]: 'crm',
  [CrmTimelineKind.Email]: 'crm',
  [CrmTimelineKind.Meeting]: 'crm',
  [CrmTimelineKind.Task]: 'crm',
  [CrmTimelineKind.Deal]: 'crm',
  [CrmTimelineKind.Lead]: 'crm',
  [CrmTimelineKind.FormSubmission]: 'website',
  [CrmTimelineKind.WebsiteChat]: 'website',
  [CrmTimelineKind.SupportTicket]: 'support',
  [CrmTimelineKind.CampaignEmail]: 'marketing',
  [CrmTimelineKind.SystemEmail]: 'tech',
  [CrmTimelineKind.WhatsappLead]: 'website',
};

/**
 * Where an entry's title links to: a relative path inside the CRM (open it with the router) or
 * an absolute URL on another portal. `null` when the entry has no page of its own.
 */
export function timelineItemHref(row: Pick<TimelineRow, 'kind' | 'url'>): string | null {
  return row.url ? appUrl(KIND_APP[row.kind], row.url) : null;
}
