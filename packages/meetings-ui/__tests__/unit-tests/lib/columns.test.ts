import { describe, expect, it } from 'vitest';
import { dateTimeColumn } from '../../../src/lib/columns';
import { cellText } from '../grid-helpers';

interface Row {
  at: string | null;
}

describe('dateTimeColumn', () => {
  const column = dateTimeColumn<Row>('at', 'When');

  it("writes the time in the viewer's format and does not offer a text filter", () => {
    expect(column.headerName).toBe('When');
    expect(column.filter).toBe(false);
    expect(cellText(column, { at: '2026-10-20T09:00:00.000Z' })).toBe(
      'at 2026-10-20T09:00:00.000Z',
    );
  });

  it('writes nothing for an empty or missing time', () => {
    expect(cellText(column, { at: null })).toBe('');
    expect(cellText(column, { at: '' })).toBe('');
  });
});
