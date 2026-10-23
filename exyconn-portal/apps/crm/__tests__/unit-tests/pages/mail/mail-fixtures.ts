import {
  CrmEmailDirection,
  CrmEmailProvider,
  CrmTimelineObject,
  GmailAccountStatus,
  type CrmMailOverviewQuery,
  type CrmMailThreadQuery,
  type CrmMailThreadsQuery,
} from '@exyconn/shell/graphql/generated';

type Mailbox = CrmMailOverviewQuery['crmMailOverview']['mailboxes'][number];
type Row = CrmMailThreadsQuery['crmMailThreads']['rows'][number];
type Thread = CrmMailThreadQuery['crmMailThread'];
type Message = Thread['messages'][number];

export const SALES = 'sales@acme.io';

export const mailbox = (fields: Partial<Mailbox> = {}): Mailbox => ({
  id: 'g1',
  email: SALES,
  provider: CrmEmailProvider.Gmail,
  readable: true,
  status: GmailAccountStatus.Connected,
  lastError: '',
  lastSyncedAt: '2026-10-20T09:00:00.000Z',
  unreadCount: 1,
  ...fields,
});

export const row = (fields: Partial<Row> = {}): Row => ({
  id: 'g1:t1',
  accountId: 'g1',
  mailbox: SALES,
  threadId: 't1',
  subject: 'Pricing',
  snippet: 'Can you share the price list?',
  fromName: 'Asha',
  fromAddress: 'asha@globex.io',
  participants: ['asha@globex.io', SALES],
  lastAt: '2026-10-20T08:00:00.000Z',
  messageCount: 2,
  unread: true,
  starred: false,
  hasAttachments: true,
  record: { object: CrmTimelineObject.Contact, id: 'c1', name: 'Asha Kumar' },
  ...fields,
});

export const message = (fields: Partial<Message> = {}): Message => ({
  id: 'm1',
  messageId: '<m1@globex.io>',
  fromName: 'Asha',
  fromAddress: 'asha@globex.io',
  to: [SALES],
  cc: ['ops@globex.io'],
  bcc: [],
  subject: 'Pricing',
  sentAt: '2026-10-20T08:00:00.000Z',
  direction: CrmEmailDirection.In,
  html: '',
  text: 'Can you share\nthe price list?',
  unread: true,
  attachments: [],
  ...fields,
});

export const thread = (fields: Partial<Thread> = {}): Thread => ({
  id: 'g1:t1',
  accountId: 'g1',
  mailbox: SALES,
  threadId: 't1',
  subject: 'Pricing',
  unread: true,
  starred: false,
  inbox: true,
  record: { object: CrmTimelineObject.Contact, id: 'c1', name: 'Asha Kumar' },
  messages: [message()],
  ...fields,
});
