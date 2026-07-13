import { describe, it, expect } from 'vitest';
import { enumOptions } from '../../src/utils/enumOptions';

describe('enumOptions', () => {
  it('title-cases underscored enum values', () => {
    expect(enumOptions(['IN_PROGRESS', 'DONE'])).toEqual([
      { value: 'IN_PROGRESS', label: 'In Progress' },
      { value: 'DONE', label: 'Done' },
    ]);
  });

  it('returns an empty list for no values', () => {
    expect(enumOptions([])).toEqual([]);
  });
});
