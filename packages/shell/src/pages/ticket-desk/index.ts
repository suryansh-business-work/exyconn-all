/**
 * The ticket desk every portal that works tickets shares — the Support console and IT's
 * helpdesk. One detail view, thread, triage, assignee, escalation and reply form, so the two
 * desks can never disagree about what a ticket says or how it moves.
 */
export { TicketDetailBody, type DetailTicket } from './TicketDetailBody';
export { TicketDetailDialog } from './TicketDetailDialog';
export { TicketDetailPage } from './TicketDetailPage';
export {
  EMPLOYEE_DESK_FILTERS,
  TicketQuickFilter,
  quickFilters,
  type QuickFilter,
} from './TicketQuickFilter';
export { SupportReplyForm } from './forms/support-reply';
export type { SupportReplyAttachment, SupportReplyFormValues } from './forms/support-reply';
export { TicketEscalateForm, type TicketEscalateValues } from './forms/ticket-escalate';
