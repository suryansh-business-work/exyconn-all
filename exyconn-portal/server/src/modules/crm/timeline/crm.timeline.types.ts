/** One thing that happened with a contact or company, from whichever module recorded it. */
export interface TimelineItem {
  id: string;
  kind: TimelineKind;
  at: Date;
  title: string;
  summary: string;
  actor: string;
  status: string;
  /**
   * Where to open it: a path inside the portal app that owns this kind (the client maps kind to
   * app), empty when it has no page of its own.
   */
  url: string;
  /** True when `url` is this entry's own page; false when it is a list or tab, or empty. */
  opensPage: boolean;
  attachments: Array<{ url: string; name: string; contentType?: string | null }>;
  /** When a task's reminder is emailed; null for everything that is not a reminder. */
  remindAt: Date | null;
}

export type TimelineKind =
  | 'NOTE'
  | 'CALL'
  | 'EMAIL'
  | 'MEETING'
  | 'TASK'
  | 'DEAL'
  | 'LEAD'
  | 'FORM_SUBMISSION'
  | 'WEBSITE_CHAT'
  | 'SUPPORT_TICKET'
  | 'CAMPAIGN_EMAIL'
  | 'SYSTEM_EMAIL'
  | 'WHATSAPP_LEAD';

/** Who the timeline is about: their addresses, and the CRM records that belong to them. */
export interface TimelineTarget {
  addresses: string[];
  contactIds: string[];
  companyId: string;
  /** The contact's or company's own page in the CRM, e.g. `/contacts/<id>`. */
  recordPath: string;
  /** The newest this many of each kind are read; the merged list is cut to the same. */
  limit: number;
}

export const item = (
  fields: Omit<
    TimelineItem,
    'attachments' | 'url' | 'opensPage' | 'status' | 'actor' | 'remindAt'
  > &
    Partial<TimelineItem>,
): TimelineItem => ({
  actor: '',
  status: '',
  url: '',
  opensPage: false,
  attachments: [],
  remindAt: null,
  ...fields,
});
