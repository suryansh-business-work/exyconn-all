import { describe, expect, it } from 'vitest';
import type { ValueFormatterParams } from 'ag-grid-community';
import {
  FRAGMENT_COLUMNS,
  LOG_COLUMNS,
  TEMPLATE_COLUMNS,
  type PagedTemplateRow,
} from '../../../../src/pages/email/email-grids';

const template = (variables: string[]): PagedTemplateRow => ({
  id: 'tpl-1',
  key: 'welcome',
  name: 'Welcome',
  description: '',
  subject: 'Hello',
  mjml: '<mjml></mjml>',
  isActive: true,
  updatedBy: 'admin',
  updatedAt: '2026-09-01T00:00:00.000Z',
  variables,
  fragments: [],
});

/** Runs the Variables column's formatter the way ag-grid does for one row. */
function variablesCell(row: PagedTemplateRow): unknown {
  const column = TEMPLATE_COLUMNS.find((col) => col.colId === 'variables');
  const format = column?.valueFormatter;
  if (typeof format !== 'function') {
    throw new TypeError('The Variables column has no formatter');
  }
  const params = { data: row, context: { t: (source: string) => source } };
  return format(params as unknown as ValueFormatterParams<PagedTemplateRow>);
}

const headers = (columns: ReadonlyArray<{ headerName?: string }>) =>
  columns.map((column) => column.headerName);

describe('email grids', () => {
  it('leads the template row with its key and ends with preview, edit and delete', () => {
    expect(headers(TEMPLATE_COLUMNS)).toEqual([
      'Key',
      'Name',
      'Subject',
      'Variables',
      'Active',
      '',
    ]);
    const actions = TEMPLATE_COLUMNS.at(-1)?.cellRendererParams as {
      actionSpecs: Array<{ key: string }>;
    };
    expect(actions.actionSpecs.map((spec) => spec.key)).toEqual(['preview', 'edit', 'delete']);
  });

  it('lists the placeholders a template uses, or a dash when it has none', () => {
    expect(variablesCell(template(['name', 'company']))).toBe('name, company');
    expect(variablesCell(template([]))).toBe('—');
  });

  it('leads the fragment row with its key, ending with edit and delete', () => {
    expect(headers(FRAGMENT_COLUMNS)).toEqual(['Key', 'Name', 'Description', 'Updated', '']);
  });

  it('shows logs read-only, with no action column', () => {
    expect(headers(LOG_COLUMNS)).toEqual([
      'When',
      'Status',
      'Template',
      'To',
      'Subject',
      'Failure reason',
    ]);
    expect(LOG_COLUMNS.some((column) => column.colId === 'actions')).toBe(false);
  });
});
