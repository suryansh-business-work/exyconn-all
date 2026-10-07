import { describe, expect, it } from 'vitest';
import type { ColDef, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import type { RowActionSpec } from '@exyconn/crud';
import { SlaState, SupportRequester } from '@exyconn/shell/graphql/generated';
import {
  TICKET_COLUMNS,
  raisedBy,
  type PagedTicketRow,
} from '../../../../src/pages/support/tickets-grid';
import { ticketRow } from '../../fixtures';

type Formatter = (params: ValueFormatterParams<PagedTicketRow>) => string;
type Getter = (params: ValueGetterParams<PagedTicketRow>) => string | null;

/** A translator that marks what it translated, so a translated cell is recognisable. */
const t = (source: string) => `«${source}»`;

const column = (id: string): ColDef<PagedTicketRow> => {
  const found = TICKET_COLUMNS.find((col) => (col.colId ?? col.field) === id);
  if (!found) {
    throw new Error(`No column ${id}`);
  }
  return found;
};

const shown = (id: string, data: PagedTicketRow | undefined) =>
  (column(id).valueFormatter as Formatter)({
    data,
    context: { t },
  } as ValueFormatterParams<PagedTicketRow>);

const derived = (id: string, data: PagedTicketRow | undefined) =>
  (column(id).valueGetter as Getter)({
    data,
    context: { t },
  } as ValueGetterParams<PagedTicketRow>);

const client = (overrides: Partial<PagedTicketRow>) =>
  ticketRow({ requesterType: SupportRequester.Client, employeeName: null, ...overrides });

describe('raisedBy', () => {
  it('names the client a customer ticket was attributed to', () => {
    const row = client({
      clientName: 'Acme Inc',
      requesterName: 'Dana Reyes',
      requesterEmail: 'dana@acme.test',
    });
    expect(raisedBy(row)).toBe('Acme Inc');
  });

  it('falls back to who wrote in, then to their address, when no client matched', () => {
    expect(
      raisedBy(client({ requesterName: 'Dana Reyes', requesterEmail: 'dana@acme.test' })),
    ).toBe('Dana Reyes');
    expect(raisedBy(client({ requesterEmail: 'dana@acme.test' }))).toBe('dana@acme.test');
  });

  it('names the employee on an employee ticket, or a dash when the name is gone', () => {
    expect(raisedBy(ticketRow())).toBe('Asha Rao');
    expect(raisedBy(ticketRow({ employeeName: null }))).toBe('—');
  });
});

describe('TICKET_COLUMNS', () => {
  it('lists who asked, the ticket facts, its SLA and owner, then the row actions', () => {
    expect(TICKET_COLUMNS.map((col) => col.colId ?? col.field)).toEqual([
      'raisedBy',
      'requesterType',
      'channel',
      'subject',
      'category',
      'priority',
      'status',
      'slaState',
      'assigneeName',
      'createdAt',
      'actions',
    ]);
  });

  it('shows who raised the ticket and its subject, and nothing while a row loads', () => {
    expect(shown('raisedBy', ticketRow())).toBe('Asha Rao');
    expect(shown('subject', ticketRow())).toBe('Laptop will not boot');
    expect(shown('subject', undefined)).toBe('');
  });

  it('shows the assignee, or says in the viewer’s words that nobody has it', () => {
    expect(shown('assigneeName', ticketRow({ assigneeName: 'Sam Lee' }))).toBe('Sam Lee');
    expect(shown('assigneeName', ticketRow())).toBe('«Unassigned»');
  });

  it('reads the SLA chip from the ticket’s SLA state', () => {
    expect(derived('slaState', ticketRow({ slaState: SlaState.Breached }))).toBe('BREACHED');
    expect(derived('slaState', undefined)).toBeNull();
  });

  it('offers open, open as a page and update status on each row', () => {
    const specs = column('actions').cellRendererParams.actionSpecs as RowActionSpec[];
    expect(specs.map((spec) => [spec.key, spec.label])).toEqual([
      ['open', 'open ticket'],
      ['page', 'open ticket page'],
      ['status', 'update status'],
    ]);
    expect(specs[0].color).toBe('primary');
  });
});
