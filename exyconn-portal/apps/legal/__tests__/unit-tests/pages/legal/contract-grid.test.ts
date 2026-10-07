import { describe, expect, it } from 'vitest';
import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import type { RowActionSpec } from '@exyconn/crud';
import { CONTRACT_COLUMNS, type PagedContractRow } from '../../../../src/pages/legal/contract-grid';
import { PDF_ACTION, WORD_ACTION } from '../../../../src/pages/legal/download-actions';

type Formatter = (params: ValueFormatterParams<PagedContractRow>) => string;

const column = (id: string): ColDef<PagedContractRow> => {
  const found = CONTRACT_COLUMNS.find((col) => (col.colId ?? col.field) === id);
  if (!found) {
    throw new Error(`No column ${id}`);
  }
  return found;
};

/** Runs a date column's formatter the way ag-grid does, with the shared context on it. */
const shownDate = (id: string, value: string | null) =>
  (column(id).valueFormatter as Formatter)({
    value,
    context: { t: (source: string) => source, formatDate: (iso: string) => `on ${iso}` },
  } as ValueFormatterParams<PagedContractRow>);

describe('CONTRACT_COLUMNS', () => {
  it('lists the register columns, then the row actions', () => {
    expect(CONTRACT_COLUMNS.map((col) => col.colId ?? col.field)).toEqual([
      'title',
      'party',
      'type',
      'expiryDate',
      'status',
      'sentAt',
      'actions',
    ]);
  });

  it('formats the expiry through the viewer settings', () => {
    expect(shownDate('expiryDate', '2027-01-01')).toBe('on 2027-01-01');
  });

  it('shows a dash for a contract that has not been sent', () => {
    expect(shownDate('sentAt', null)).toBe('—');
    expect(shownDate('sentAt', '2026-10-02')).toBe('on 2026-10-02');
  });

  it('offers edit, send, both downloads and delete, in that order', () => {
    const specs = column('actions').cellRendererParams.actionSpecs as RowActionSpec[];
    expect(specs.map((spec) => spec.key)).toEqual(['edit', 'send', 'pdf', 'docx', 'delete']);
    expect(specs[1]).toMatchObject({ label: 'send contract', color: 'primary' });
    expect(specs[2]).toBe(PDF_ACTION);
    expect(specs[3]).toBe(WORD_ACTION);
  });

  it('names the download buttons after the export format they produce', () => {
    expect(PDF_ACTION).toMatchObject({ key: 'pdf', label: 'download PDF' });
    expect(WORD_ACTION).toMatchObject({ key: 'docx', label: 'download Word document' });
  });
});
