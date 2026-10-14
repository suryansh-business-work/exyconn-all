import { describe, expect, it } from 'vitest';
import {
  SESSION_COLUMNS,
  deviceLabel,
  type SessionRow,
} from '../../../../src/admin/sessions/session.columns';
import { sessionRow } from '../admin.fixtures';

const t = (source: string) => `«${source}»`;
const context = {
  t,
  formatDateTime: (iso: string) => `at ${iso}`,
  industryName: (key: string) => (key === 'clinic' ? 'Healthcare' : key),
};

type Getter = (params: { data: SessionRow | undefined; context: unknown }) => unknown;
type Formatter = (params: {
  data: SessionRow | undefined;
  value: unknown;
  context: unknown;
}) => string;

const column = (id: string) => {
  const found = SESSION_COLUMNS.find((col) => (col.colId ?? col.field) === id);
  if (!found) {
    throw new Error(`No column ${id}`);
  }
  return found;
};

/** What a column shows for a row: its getter, then its formatter, as ag-grid applies them. */
function cell(id: string, data: SessionRow | undefined): unknown {
  const col = column(id);
  const getter = col.valueGetter as unknown as Getter | undefined;
  const value = getter ? getter({ data, context }) : data?.[id as keyof SessionRow];
  const formatter = col.valueFormatter as unknown as Formatter | undefined;
  return formatter ? formatter({ data, value, context }) : value;
}

describe('deviceLabel', () => {
  it('names the known devices, translated', () => {
    expect(deviceLabel('phone', t)).toBe('«Phone»');
    expect(deviceLabel('whatsapp', t)).toBe('«WhatsApp»');
  });

  it('passes an unknown device through the translator and dashes a missing one', () => {
    expect(deviceLabel('smart-tv', t)).toBe('«smart-tv»');
    expect(deviceLabel(null, t)).toBe('—');
    expect(deviceLabel(undefined, t)).toBe('—');
    expect(deviceLabel('', t)).toBe('—');
  });
});

describe('SESSION_COLUMNS', () => {
  it('has the session log columns, newest first, filtering only what the server filters', () => {
    expect(SESSION_COLUMNS.map((col) => col.headerName)).toEqual([
      'User',
      'Started',
      'Duration',
      'Device',
      'Industries opened',
      'Flows started',
      'Flows completed',
      'Events',
      'Status',
    ]);
    expect(column('startedAt')).toMatchObject({
      sort: 'desc',
      filter: false,
      floatingFilter: false,
    });
    expect(column('demos')).toMatchObject({ sortable: false, filter: false });
  });

  it('writes each cell of a loaded row', () => {
    const row = sessionRow({ demos: ['clinic', 'salon'], device: 'tablet' });
    expect(cell('user', row)).toBe('Ravi Kumar · ravi@example.com');
    expect(cell('startedAt', row)).toBe('at 2026-10-01T09:00:00.000Z');
    expect(cell('durationMs', row)).toBe('5m');
    expect(cell('device', row)).toBe('«Tablet»');
    expect(cell('demos', row)).toBe('Healthcare, salon');
    expect(cell('flowsStarted', row)).toBe('2');
    expect(cell('flowsCompleted', row)).toBe('1');
    expect(cell('events', row)).toBe('6');
  });

  it('leaves the cells of a row still loading empty', () => {
    expect(cell('startedAt', undefined)).toBe('');
    expect(cell('demos', undefined)).toBe('');
    expect(cell('user', undefined)).toBe('');
  });
});
