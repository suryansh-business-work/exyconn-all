import { describe, expect, it } from 'vitest';
import { ANNOUNCEMENT_COLUMNS } from '../../../../src/pages/announcements/announcements-grid';
import { actionKeys, columnIds } from '../../harness/grid';

describe('ANNOUNCEMENT_COLUMNS', () => {
  it('lays out the announcement register with edit and delete at the end', () => {
    expect(columnIds(ANNOUNCEMENT_COLUMNS)).toEqual([
      'title',
      'category',
      'audience',
      'pinned',
      'publishedAt',
      'expiresAt',
      'actions',
    ]);
    expect(actionKeys(ANNOUNCEMENT_COLUMNS)).toEqual(['edit', 'delete']);
  });
});
