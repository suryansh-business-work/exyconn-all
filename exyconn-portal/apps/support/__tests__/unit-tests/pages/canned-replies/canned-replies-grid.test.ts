import { describe, expect, it } from 'vitest';
import type { RowActionSpec } from '@exyconn/crud';
import { CANNED_REPLY_COLUMNS } from '../../../../src/pages/canned-replies/canned-replies-grid';

describe('CANNED_REPLY_COLUMNS', () => {
  it('lists the snippet, its category, its text and whether it is offered, then actions', () => {
    expect(CANNED_REPLY_COLUMNS.map((col) => [col.colId ?? col.field, col.headerName])).toEqual([
      ['title', 'Snippet'],
      ['category', 'Category'],
      ['body', 'Text'],
      ['isActive', 'Offered'],
      ['actions', ''],
    ]);
  });

  it('offers edit and delete on each row', () => {
    const actions = CANNED_REPLY_COLUMNS.at(-1);
    const specs = actions?.cellRendererParams.actionSpecs as RowActionSpec[];
    expect(specs.map((spec) => spec.key)).toEqual(['edit', 'delete']);
  });
});
