import {
  SlaState,
  SupportCategory,
  SupportPriority,
  SupportRequester,
  SupportStatus,
  TicketChannel,
} from '@exyconn/shell/graphql/generated';
import type { TableStatsShape } from '@exyconn/shell/components/data/tableStats';
import type { PagedTicketRow } from '../../src/pages/support/tickets-grid';
import type { CannedReplyRow } from '../../src/pages/canned-replies/forms/canned-reply';
import type { SlaPolicyRow } from '../../src/pages/support/sla/forms/sla-policy';
import type { PagedKbArticleRow } from '../../src/pages/knowledge-base/kb-articles-grid';

/** An open employee ticket, unassigned, as the paged console query returns it. */
export function ticketRow(overrides: Partial<PagedTicketRow> = {}): PagedTicketRow {
  return {
    __typename: 'SupportTicket',
    id: 'ticket-1',
    employeeId: 'employee-1',
    employeeName: 'Asha Rao',
    requesterType: SupportRequester.Employee,
    channel: TicketChannel.Portal,
    reference: 'SUP-0001',
    clientId: '',
    clientName: '',
    requesterName: '',
    requesterEmail: '',
    subject: 'Laptop will not boot',
    category: SupportCategory.It,
    description: 'The laptop shows a black screen after the logo.',
    priority: SupportPriority.High,
    status: SupportStatus.Open,
    assigneeId: '',
    assigneeName: '',
    dueAt: null,
    firstRespondedAt: null,
    resolvedAt: null,
    slaState: SlaState.OnTrack,
    topic: '',
    escalationLevel: 0,
    escalatedAt: null,
    createdAt: '2026-10-01T09:00:00.000Z',
    attachments: [],
    ...overrides,
  };
}

/** A canned reply that is offered in the composer. */
export function cannedReplyRow(overrides: Partial<CannedReplyRow> = {}): CannedReplyRow {
  return {
    __typename: 'CannedReply',
    id: 'reply-1',
    title: 'Ask for a screenshot',
    category: SupportCategory.Hr,
    body: 'Could you send a screenshot of what you see?',
    isActive: true,
    ...overrides,
  };
}

/** The HIGH priority promise: an hour to answer, a working day to finish. */
export function slaPolicyRow(overrides: Partial<SlaPolicyRow> = {}): SlaPolicyRow {
  return {
    __typename: 'SupportSlaPolicy',
    id: 'policy-1',
    priority: SupportPriority.High,
    firstResponseMinutes: 60,
    resolutionMinutes: 480,
    active: true,
    ...overrides,
  };
}

/** A published knowledge-base article. */
export function kbArticleRow(overrides: Partial<PagedKbArticleRow> = {}): PagedKbArticleRow {
  return {
    __typename: 'KbArticle',
    id: 'article-1',
    title: 'Resetting your password',
    slug: 'reset-password',
    category: SupportCategory.It,
    summary: 'How to get back in',
    body: '<p>Steps</p>',
    isPublished: true,
    updatedByName: 'Priya',
    updatedAt: '2026-09-30T00:00:00.000Z',
    ...overrides,
  };
}

/**
 * A `listXxxStats` result: `counts` is field -> value -> count, the shape the server's one
 * aggregation answers with.
 */
export function tableStats(
  total: number,
  counts: Record<string, Record<string, number>> = {},
): TableStatsShape {
  return {
    total,
    counts: Object.entries(counts).map(([field, buckets]) => ({
      field,
      buckets: Object.entries(buckets).map(([value, count]) => ({ value, count })),
    })),
    sums: [],
  };
}
