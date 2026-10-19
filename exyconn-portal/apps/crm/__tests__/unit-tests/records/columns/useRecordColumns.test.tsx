import { describe, expect, it } from 'vitest';
import type { ColDef } from 'ag-grid-community';
import { CrmPropertyType, SortDir } from '@exyconn/shell/graphql/generated';
import { useRecordColumns } from '../../../../src/records/columns/useRecordColumns';
import type { CrmRecordRow } from '../../../../src/records/schema';
import { renderHookWithProviders } from '../../test-utils';
import { property } from '../records-fixtures';

const PAGE: ColDef<CrmRecordRow>[] = [
  { field: 'name', headerName: 'Name' },
  { colId: 'client', headerName: 'Client' },
  { colId: 'actions' },
];
const PROPERTIES = [
  property(),
  property({ key: 'vip', label: 'VIP', type: CrmPropertyType.Boolean, builtIn: false }),
];

describe('useRecordColumns', () => {
  it('describes the page defaults when the view chose no columns', () => {
    const { result } = renderHookWithProviders(() =>
      useRecordColumns(PAGE, PROPERTIES, [], [{ property: 'name', dir: SortDir.Asc }]),
    );
    expect(result.current.visible).toEqual(['name', 'client']);
    expect(result.current.defaults).toEqual(['name', 'client']);
    expect(result.current.exportColumns).toEqual(['name']);
    expect(result.current.choices.map((choice) => choice.id)).toEqual(['name', 'vip']);
    expect(result.current.columnDefs.map((column) => column.colId ?? column.field)).toEqual([
      'name',
      'client',
      'actions',
    ]);
    expect(result.current.columnDefs[0].initialSort).toBe('asc');
  });

  it('follows the view columns and formats Yes/No with the translated words', () => {
    const { result } = renderHookWithProviders(
      () => useRecordColumns(PAGE, PROPERTIES, ['vip', 'name'], []),
      { messages: { Yes: 'Oui' } },
    );
    expect(result.current.visible).toEqual(['vip', 'name']);
    expect(result.current.exportColumns).toEqual(['vip', 'name']);
    const getter = result.current.columnDefs[0].valueGetter as (params: object) => string;
    expect(getter({ data: { id: 'r', custom: { vip: true } } })).toBe('Oui');
  });
});
