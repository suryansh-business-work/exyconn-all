import { addDays, isValid, startOfDay, subMilliseconds } from 'date-fns';
import { FilterOp, type TableFilterInput } from '@exyconn/shell/graphql/generated';

/** A from–to pair of picked days; either end may be open. */
export interface DayRange {
  from: Date | null;
  to: Date | null;
}

/** What the toolbar above the chat list narrows it by. Empty means "any". */
export interface ChatSessionFilterState {
  status: string;
  site: string;
  assignee: string;
  unreadOnly: boolean;
  created: DayRange;
  lastMessage: DayRange;
}

const OPEN_RANGE: DayRange = { from: null, to: null };

export const EMPTY_CHAT_SESSION_FILTERS: ChatSessionFilterState = {
  status: '',
  site: '',
  assignee: '',
  unreadOnly: false,
  created: OPEN_RANGE,
  lastMessage: OPEN_RANGE,
};

const usable = (date: Date | null): date is Date => date !== null && isValid(date);

/**
 * A day range as two server filters on a date field: after the instant before the first day
 * began, and before the day after the last one began — the days the viewer picked, inclusive.
 */
function rangeFilters(field: string, range: DayRange): TableFilterInput[] {
  const filters: TableFilterInput[] = [];
  if (usable(range.from)) {
    const after = subMilliseconds(startOfDay(range.from), 1).toISOString();
    filters.push({ field, op: FilterOp.Gt, value: after });
  }
  if (usable(range.to)) {
    const before = addDays(startOfDay(range.to), 1).toISOString();
    filters.push({ field, op: FilterOp.Lt, value: before });
  }
  return filters;
}

/** The server filters the toolbar adds to every page request (fields of websiteChatSessionsPaged). */
export function chatSessionFilters(state: ChatSessionFilterState): TableFilterInput[] {
  const filters: TableFilterInput[] = [];
  if (state.status) {
    filters.push({ field: 'status', op: FilterOp.Equals, value: state.status });
  }
  if (state.site) {
    filters.push({ field: 'site', op: FilterOp.Equals, value: state.site });
  }
  const assignee = state.assignee.trim();
  if (assignee) {
    filters.push({ field: 'assigneeName', op: FilterOp.Contains, value: assignee });
  }
  if (state.unreadOnly) {
    filters.push({ field: 'staffUnread', op: FilterOp.Gt, value: '0' });
  }
  return [
    ...filters,
    ...rangeFilters('createdAt', state.created),
    ...rangeFilters('lastMessageAt', state.lastMessage),
  ];
}

/** True when any filter is set, so the toolbar can offer to clear them. */
export const hasChatSessionFilters = (state: ChatSessionFilterState): boolean =>
  chatSessionFilters(state).length > 0;

/** True when a range ends before it starts. */
export const rangeIsBackwards = (range: DayRange): boolean =>
  usable(range.from) && usable(range.to) && range.to < range.from;
