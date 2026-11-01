import { describe, expect, it } from 'vitest';
import { FilterOp } from '@exyconn/shell/graphql/generated';
import {
  EMPTY_CHAT_SESSION_FILTERS,
  chatSessionFilters,
  hasChatSessionFilters,
  rangeIsBackwards,
  type ChatSessionFilterState,
} from '../../../../../src/pages/chat/sessions/chat-sessions.filters';

const filtersWith = (overrides: Partial<ChatSessionFilterState>): ChatSessionFilterState => ({
  ...EMPTY_CHAT_SESSION_FILTERS,
  ...overrides,
});

/** 10 March 2026, mid-afternoon, and 12 March, morning — picked days carry a time of day too. */
const MARCH_10 = new Date(2026, 2, 10, 15, 30);
const MARCH_12 = new Date(2026, 2, 12, 8, 0);
const INVALID = new Date('not a date');

describe('chatSessionFilters', () => {
  it('adds no filters when nothing is set', () => {
    expect(chatSessionFilters(EMPTY_CHAT_SESSION_FILTERS)).toEqual([]);
    expect(hasChatSessionFilters(EMPTY_CHAT_SESSION_FILTERS)).toBe(false);
  });

  it('turns status, site, a trimmed assignee and unread-only into server filters', () => {
    const state = filtersWith({
      status: 'OPEN',
      site: 'TOOLS',
      assignee: '  Ravi ',
      unreadOnly: true,
    });
    expect(chatSessionFilters(state)).toEqual([
      { field: 'status', op: FilterOp.Equals, value: 'OPEN' },
      { field: 'site', op: FilterOp.Equals, value: 'TOOLS' },
      { field: 'assigneeName', op: FilterOp.Contains, value: 'Ravi' },
      { field: 'staffUnread', op: FilterOp.Gt, value: '0' },
    ]);
    expect(hasChatSessionFilters(state)).toBe(true);
  });

  it('ignores an assignee of only spaces', () => {
    expect(chatSessionFilters(filtersWith({ assignee: '   ' }))).toEqual([]);
  });

  it('covers the picked days whole, from the start of the first to the end of the last', () => {
    const filters = chatSessionFilters(filtersWith({ created: { from: MARCH_10, to: MARCH_12 } }));
    expect(filters).toEqual([
      {
        field: 'createdAt',
        op: FilterOp.Gt,
        value: new Date(2026, 2, 9, 23, 59, 59, 999).toISOString(),
      },
      { field: 'createdAt', op: FilterOp.Lt, value: new Date(2026, 2, 13).toISOString() },
    ]);
  });

  it('filters the last message date the same way, after the other filters', () => {
    const filters = chatSessionFilters(
      filtersWith({ status: 'CLOSED', lastMessage: { from: null, to: MARCH_12 } }),
    );
    expect(filters).toEqual([
      { field: 'status', op: FilterOp.Equals, value: 'CLOSED' },
      { field: 'lastMessageAt', op: FilterOp.Lt, value: new Date(2026, 2, 13).toISOString() },
    ]);
  });

  it('leaves an open start end unbounded', () => {
    const filters = chatSessionFilters(filtersWith({ created: { from: MARCH_10, to: null } }));
    expect(filters).toHaveLength(1);
    expect(filters[0]).toMatchObject({ field: 'createdAt', op: FilterOp.Gt });
  });

  it('skips a day that is not a valid date', () => {
    const state = filtersWith({ created: { from: INVALID, to: INVALID } });
    expect(chatSessionFilters(state)).toEqual([]);
    expect(hasChatSessionFilters(state)).toBe(false);
  });

  it('counts a date range alone as a filter that can be cleared', () => {
    expect(hasChatSessionFilters(filtersWith({ lastMessage: { from: MARCH_10, to: null } }))).toBe(
      true,
    );
  });
});

describe('rangeIsBackwards', () => {
  it('is true only when the end is before the start', () => {
    expect(rangeIsBackwards({ from: MARCH_12, to: MARCH_10 })).toBe(true);
    expect(rangeIsBackwards({ from: MARCH_10, to: MARCH_12 })).toBe(false);
    expect(rangeIsBackwards({ from: MARCH_10, to: MARCH_10 })).toBe(false);
  });

  it('is false while either end is open or not a valid date', () => {
    expect(rangeIsBackwards({ from: MARCH_12, to: null })).toBe(false);
    expect(rangeIsBackwards({ from: null, to: MARCH_10 })).toBe(false);
    expect(rangeIsBackwards({ from: INVALID, to: MARCH_10 })).toBe(false);
    expect(rangeIsBackwards({ from: MARCH_12, to: INVALID })).toBe(false);
  });
});
