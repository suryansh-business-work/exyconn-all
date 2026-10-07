import { describe, expect, it } from 'vitest';
import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import type { RowActionSpec } from '@exyconn/crud';
import { countryName } from '@exyconn/i18n';
import {
  CLIENT_COLUMNS,
  HUB_ACCESS_ACTION,
  type PagedClientRow,
} from '../../../../src/pages/clients/clients-grid';

type Formatter = (params: ValueFormatterParams<PagedClientRow>) => string;

const column = (id: string): ColDef<PagedClientRow> => {
  const found = CLIENT_COLUMNS.find((col) => (col.colId ?? col.field) === id);
  if (!found) {
    throw new Error(`No column ${id}`);
  }
  return found;
};

/** Runs a column's formatter the way ag-grid does, with the shared translator on context. */
const shown = (id: string, data: Partial<PagedClientRow> | undefined) =>
  (column(id).valueFormatter as Formatter)({
    data,
    context: { t: (source: string) => source },
  } as ValueFormatterParams<PagedClientRow>);

describe('CLIENT_COLUMNS', () => {
  it('lists the directory columns and the row actions, in that order', () => {
    expect(CLIENT_COLUMNS.map((col) => col.colId ?? col.field)).toEqual([
      'name',
      'company',
      'email',
      'phone',
      'country',
      'taxId',
      'status',
      'actions',
    ]);
  });

  it('names the country, and leaves a client with none blank', () => {
    expect(shown('country', { country: 'DE' })).toBe(countryName('DE'));
    expect(shown('country', { country: '' })).toBe('');
    expect(shown('country', undefined)).toBe('');
  });

  it('prefixes the tax number with what it is called, and leaves no number blank', () => {
    expect(shown('taxId', { taxId: '27AAPFU0939F1ZV', taxIdLabel: 'GSTIN' })).toBe(
      'GSTIN 27AAPFU0939F1ZV',
    );
    expect(shown('taxId', { taxId: '', taxIdLabel: 'GSTIN' })).toBe('');
  });

  it('offers client hub access before edit and delete', () => {
    const specs = column('actions').cellRendererParams.actionSpecs as RowActionSpec[];
    expect(specs.map((spec) => spec.key)).toEqual(['hubAccess', 'edit', 'delete']);
    expect(HUB_ACCESS_ACTION).toMatchObject({ label: 'client hub access', color: 'primary' });
  });
});
