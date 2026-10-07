import { describe, expect, it } from 'vitest';
import { REVIEW_COLUMNS } from '../../../../src/pages/reviews/reviews-grid';
import { reviewRow } from '../compliance.fixtures';
import { formatCell, headersOf } from '../grid.helpers';

describe('REVIEW_COLUMNS', () => {
  it('shows each review and how much it left outstanding', () => {
    expect(headersOf(REVIEW_COLUMNS)).toEqual([
      'Ref',
      'Review',
      'Held',
      'Chair',
      'Standards',
      'Open actions',
      'Status',
      '',
    ]);
  });

  it('names the standards and counts the open actions', () => {
    expect(formatCell(REVIEW_COLUMNS, 'standards', reviewRow())).toBe('ISO 9001');
    expect(formatCell(REVIEW_COLUMNS, 'openActionCount', reviewRow({ openActionCount: 0 }))).toBe(
      '0',
    );
    expect(formatCell(REVIEW_COLUMNS, 'openActionCount', undefined)).toBe('');
  });

  it('formats the date it was held through the viewer settings', () => {
    const held = '2026-09-30T00:00:00.000Z';
    expect(formatCell(REVIEW_COLUMNS, 'heldOn', reviewRow(), held)).toBe(`on ${held}`);
  });
});
