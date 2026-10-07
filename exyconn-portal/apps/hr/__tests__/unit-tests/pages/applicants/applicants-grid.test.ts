import { describe, expect, it } from 'vitest';
import { APPLICANT_COLUMNS, ratingStars } from '../../../../src/pages/applicants/applicants-grid';
import { actionKeys, columnIds, formatCell } from '../../harness/grid';
import { applicantRow } from './applicant-fixture';

describe('ratingStars', () => {
  it('draws filled stars for the rating out of five', () => {
    expect(ratingStars(1)).toBe('★☆☆☆☆');
    expect(ratingStars(3)).toBe('★★★☆☆');
    expect(ratingStars(5)).toBe('★★★★★');
  });

  it('leaves an unrated applicant as a dash', () => {
    expect(ratingStars(0)).toBe('—');
    expect(ratingStars(-1)).toBe('—');
  });
});

describe('APPLICANT_COLUMNS', () => {
  it('lists the pipeline columns and the four row actions', () => {
    expect(columnIds(APPLICANT_COLUMNS)).toEqual([
      'name',
      'email',
      'jobTitle',
      'stage',
      'rating',
      'createdAt',
      'source',
      'actions',
    ]);
    expect(actionKeys(APPLICANT_COLUMNS)).toEqual(['advance', 'details', 'edit', 'delete']);
  });

  it('shows the rating as stars, and nothing for a row still loading', () => {
    expect(formatCell(APPLICANT_COLUMNS, 'rating', applicantRow({ rating: 2 }))).toBe('★★☆☆☆');
    expect(formatCell(APPLICANT_COLUMNS, 'rating', undefined)).toBe('');
  });
});
