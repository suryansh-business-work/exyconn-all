import { describe, expect, it } from 'vitest';
import {
  HELPDESK_COLUMNS,
  type PagedItTicketRow,
} from '../../../../src/pages/helpdesk/helpdesk-grid';
import { actionKeys, formatCell, getCell, headersOf } from '../../core/grid.helpers';

/** Only the fields the helpdesk columns read; the rest of a ticket does not matter here. */
const ticket = (overrides: Partial<PagedItTicketRow> = {}) =>
  ({
    id: 't-1',
    reference: 'TCK-0042',
    subject: 'Laptop will not boot',
    employeeName: 'Ana Rao',
    topic: 'Hardware',
    slaState: 'ON_TRACK',
    escalationLevel: 0,
    assigneeName: 'Ravi',
    ...overrides,
  }) as PagedItTicketRow;

describe('HELPDESK_COLUMNS', () => {
  it("reads the queue's reference, subject, raiser, topic, priority, status, SLA and owner", () => {
    expect(headersOf(HELPDESK_COLUMNS)).toEqual([
      'Ref',
      'Subject',
      'Raised by',
      'Topic',
      'Priority',
      'Status',
      'SLA',
      'Escalated',
      'Assigned to',
      'Raised',
      '',
    ]);
    expect(actionKeys(HELPDESK_COLUMNS)).toEqual(['open', 'page']);
  });

  it('writes what each ticket says', () => {
    const row = ticket();
    expect(formatCell(HELPDESK_COLUMNS, 'reference', row)).toBe('TCK-0042');
    expect(formatCell(HELPDESK_COLUMNS, 'subject', row)).toBe('Laptop will not boot');
    expect(formatCell(HELPDESK_COLUMNS, 'raisedBy', row)).toBe('Ana Rao');
    expect(formatCell(HELPDESK_COLUMNS, 'topic', row)).toBe('Hardware');
    expect(getCell(HELPDESK_COLUMNS, 'slaState', row)).toBe('ON_TRACK');
    expect(formatCell(HELPDESK_COLUMNS, 'assigneeName', row)).toBe('Ravi');
    expect(formatCell(HELPDESK_COLUMNS, 'createdAt', row, '2026-10-01')).toBe('on 2026-10-01');
  });

  it('dashes a ticket with no raiser, no topic and no escalation', () => {
    const row = ticket({ employeeName: null, topic: '' });
    expect(formatCell(HELPDESK_COLUMNS, 'raisedBy', row)).toBe('—');
    expect(formatCell(HELPDESK_COLUMNS, 'topic', row)).toBe('—');
    expect(formatCell(HELPDESK_COLUMNS, 'escalationLevel', row)).toBe('—');
  });

  it('names the escalation level once a ticket is escalated', () => {
    expect(formatCell(HELPDESK_COLUMNS, 'escalationLevel', ticket({ escalationLevel: 2 }))).toBe(
      'L2',
    );
  });

  it('says a ticket nobody has picked up is unassigned', () => {
    expect(formatCell(HELPDESK_COLUMNS, 'assigneeName', ticket({ assigneeName: '' }))).toBe(
      'Unassigned',
    );
  });

  it('shows nothing while a row is still loading', () => {
    expect(formatCell(HELPDESK_COLUMNS, 'subject', undefined)).toBe('');
    expect(getCell(HELPDESK_COLUMNS, 'slaState', undefined)).toBeNull();
  });
});
