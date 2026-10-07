import { describe, expect, it } from 'vitest';
import type { ValueFormatterParams } from 'ag-grid-community';
import {
  KB_ARTICLE_COLUMNS,
  type PagedKbArticleRow,
} from '../../../../src/pages/knowledge-base/kb-articles-grid';
import { kbArticleRow } from '../../fixtures';

describe('KB_ARTICLE_COLUMNS', () => {
  it('lists title, category, summary, publication and the last edit, then actions', () => {
    expect(KB_ARTICLE_COLUMNS.map((col) => [col.colId ?? col.field, col.headerName])).toEqual([
      ['title', 'Title'],
      ['category', 'Category'],
      ['summary', 'Summary'],
      ['isPublished', 'Published'],
      ['updatedByName', 'Last edited by'],
      ['updatedAt', 'Updated'],
      ['actions', ''],
    ]);
  });

  it('writes the update date in the viewer’s own format', () => {
    const updated = KB_ARTICLE_COLUMNS.find((col) => col.field === 'updatedAt');
    const format = updated?.valueFormatter as (
      params: ValueFormatterParams<PagedKbArticleRow>,
    ) => string;
    const row = kbArticleRow();
    expect(
      format({
        data: row,
        value: row.updatedAt,
        context: { formatDate: (value: string) => `on ${value}` },
      } as ValueFormatterParams<PagedKbArticleRow>),
    ).toBe('on 2026-09-30T00:00:00.000Z');
  });
});
