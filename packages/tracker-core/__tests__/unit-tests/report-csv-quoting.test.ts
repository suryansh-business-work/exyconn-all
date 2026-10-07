import { describe, expect, it } from 'vitest';
import { buildReportCsv } from '../../src/report-csv';

const DAY = { activeMs: 3_600_000, idleMs: 0, keyCount: 1, mouseCount: 2, sessions: 1 };

describe('buildReportCsv quoting', () => {
  it('quotes a field holding a comma so the row is not split', () => {
    const { content } = buildReportCsv([{ ...DAY, date: '2026-02-03, Tue' }], '2026-02');

    expect(content.split('\n')[1]).toBe('"2026-02-03, Tue",1.00,0.00,100,1,2,1');
  });

  it('doubles embedded quotes and quotes a field with a newline', () => {
    const { content } = buildReportCsv([{ ...DAY, date: 'the "3rd"\nof Feb' }], '2026-02');

    expect(content).toContain('"the ""3rd""\nof Feb",1.00');
  });
});
