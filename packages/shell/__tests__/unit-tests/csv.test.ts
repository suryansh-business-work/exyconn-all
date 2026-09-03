import { describe, it, expect } from 'vitest';
import { toCsv } from '../../src/utils/csv';

type Row = { name: string; amount: number | null; note?: string; when?: Date };
const cols = [
  { header: 'Name', value: (r: Row) => r.name },
  { header: 'Amount', value: (r: Row) => r.amount },
  { header: 'Note', value: (r: Row) => r.note },
  { header: 'When', value: (r: Row) => r.when },
];

describe('toCsv', () => {
  it('writes a header and one line per row with CRLF endings', () => {
    const csv = toCsv([{ name: 'Asha', amount: 10 }], cols);
    expect(csv.split('\r\n')).toEqual(['Name,Amount,Note,When', 'Asha,10,,']);
  });

  it('quotes cells containing commas, quotes or newlines and doubles inner quotes', () => {
    const csv = toCsv([{ name: 'Rao, "Bill"', amount: 1, note: 'line1\nline2' }], cols);
    expect(csv.split('\r\n')[1]).toBe('"Rao, ""Bill""",1,"line1\nline2",');
  });

  it('renders null and undefined as empty, dates as ISO', () => {
    const when = new Date('2026-03-01T00:00:00.000Z');
    const csv = toCsv([{ name: 'X', amount: null, when }], cols);
    expect(csv.split('\r\n')[1]).toBe('X,,,2026-03-01T00:00:00.000Z');
  });

  it('quotes a header that needs it', () => {
    const csv = toCsv([], [{ header: 'Amount, INR', value: () => 0 }]);
    expect(csv).toBe('"Amount, INR"');
  });
});
