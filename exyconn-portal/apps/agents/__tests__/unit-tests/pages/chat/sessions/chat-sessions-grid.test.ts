import { describe, expect, it, vi } from 'vitest';
import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import type { RowActionSpec } from '@exyconn/crud';
import { WebsiteChatSite, WebsiteChatStatus } from '@exyconn/shell/graphql/generated';
import {
  CHAT_SESSION_COLUMNS,
  SITE_LABEL,
  type ChatSessionRow,
} from '../../../../../src/pages/chat/sessions/chat-sessions-grid';
import {
  AssigneeCell,
  ClosesInCell,
  LastMessageCell,
  UnreadCell,
  VisitorCell,
} from '../../../../../src/pages/chat/sessions/chat-sessions-cells';
import { sessionRow } from './fixtures';

/** What the grid puts on ag-grid's context: a translator that marks what it translated. */
const context = {
  t: (source: string) => `«${source}»`,
  formatRelative: vi.fn((iso: string) => `rel ${iso}`),
};

function column(key: string): ColDef<ChatSessionRow> {
  const found = CHAT_SESSION_COLUMNS.find((col) => col.field === key || col.colId === key);
  if (!found) {
    throw new Error(`No column for ${key}`);
  }
  return found;
}

function format(key: string, data?: ChatSessionRow): string {
  const formatter = column(key).valueFormatter;
  if (typeof formatter !== 'function') {
    throw new TypeError(`Column ${key} has no formatter`);
  }
  return formatter({ data, context, value: undefined } as ValueFormatterParams<ChatSessionRow>);
}

describe('CHAT_SESSION_COLUMNS', () => {
  it('lays out the chat list with its own cells', () => {
    expect(CHAT_SESSION_COLUMNS.map((col) => col.field ?? col.colId)).toEqual([
      'name',
      'site',
      'status',
      'ticketReference',
      'assigneeName',
      'lastMessageAt',
      'expiresAt',
      'staffUnread',
      'messageCount',
      'createdAt',
      'actions',
    ]);
    expect(column('name').cellRenderer).toBe(VisitorCell);
    expect(column('assigneeName').cellRenderer).toBe(AssigneeCell);
    expect(column('lastMessageAt').cellRenderer).toBe(LastMessageCell);
    expect(column('expiresAt').cellRenderer).toBe(ClosesInCell);
    expect(column('staffUnread').cellRenderer).toBe(UnreadCell);
  });

  it('only lets the server sort the columns it can sort by', () => {
    for (const key of ['ticketReference', 'assigneeName', 'expiresAt', 'staffUnread']) {
      expect(column(key).sortable).toBe(false);
    }
    expect(column('assigneeName').filter).toBeUndefined();
    expect(column('lastMessageAt').filter).toBe(false);
  });

  it('exports the visitor with whichever contact details they gave', () => {
    expect(format('name', sessionRow())).toBe('Asha Rao · asha@example.test · +91 98450 00000');
    expect(format('name', sessionRow({ phone: '' }))).toBe('Asha Rao · asha@example.test');
    expect(format('name')).toBe('');
  });

  it('names the site in the viewer’s language', () => {
    expect(format('site', sessionRow())).toBe(`«${SITE_LABEL[WebsiteChatSite.Website]}»`);
    expect(format('site', sessionRow({ site: WebsiteChatSite.Tools }))).toBe('«Tools site»');
  });

  it('shows the ticket, the counts and the assignee or "Unassigned"', () => {
    expect(format('ticketReference', sessionRow())).toBe('TCK-42');
    expect(format('staffUnread', sessionRow())).toBe('3');
    expect(format('messageCount', sessionRow())).toBe('12');
    expect(format('assigneeName', sessionRow({ assigneeName: 'Mina' }))).toBe('Mina');
    expect(format('assigneeName', sessionRow())).toBe('«Unassigned»');
  });

  it('exports the last message with how long ago it came', () => {
    const row = sessionRow();
    expect(format('lastMessageAt', row)).toBe(
      `Do you build chatbots? · rel ${row.lastMessageAt ?? ''}`,
    );
    expect(format('lastMessageAt', sessionRow({ lastMessageAt: null }))).toBe(
      'Do you build chatbots?',
    );
    expect(
      format('lastMessageAt', sessionRow({ lastMessagePreview: '', lastMessageAt: null })),
    ).toBe('');
    expect(format('lastMessageAt')).toBe('');
  });

  it('exports when an open chat closes, and nothing for a closed one', () => {
    const row = sessionRow();
    expect(format('expiresAt', row)).toBe(`rel ${row.expiresAt ?? ''}`);
    expect(format('expiresAt', sessionRow({ status: WebsiteChatStatus.Closed }))).toBe('');
    expect(format('expiresAt', sessionRow({ expiresAt: null }))).toBe('');
    expect(format('expiresAt')).toBe('');
  });

  it('offers open, close and delete, hiding close on a closed chat', () => {
    const specs = (column('actions').cellRendererParams as { actionSpecs: RowActionSpec[] })
      .actionSpecs;
    expect(specs.map((spec) => spec.key)).toEqual(['open', 'close', 'delete']);
    const hidden = specs[1].hidden as (row: ChatSessionRow) => boolean;
    expect(hidden(sessionRow({ status: WebsiteChatStatus.Closed }))).toBe(true);
    expect(hidden(sessionRow())).toBe(false);
  });
});
