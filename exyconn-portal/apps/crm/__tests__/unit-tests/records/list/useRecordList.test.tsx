import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import type { ColDef } from 'ag-grid-community';
import { CrmObject, SearchLeadsDocument } from '@exyconn/shell/graphql/generated';
import { useRecordList, withRefreshSignal } from '../../../../src/records/list';
import type { CrmRecordRow } from '../../../../src/records/schema';
import { renderHookWithProviders } from '../../test-utils';
import { objectSchema, property } from '../records-fixtures';

const mocked = vi.hoisted(() => ({ schema: vi.fn(), views: vi.fn() }));

vi.mock('../../../../src/records/schema', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/records/schema')>()),
  useObjectSchema: (object: unknown) => mocked.schema(object),
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmViewsQuery: () => mocked.views(),
}));

const COLUMNS: ColDef<CrmRecordRow>[] = [
  { field: 'name', headerName: 'Name' },
  { colId: 'client', headerName: 'Client' },
  { colId: 'actions' },
];

describe('useRecordList', () => {
  beforeEach(() => {
    mocked.schema.mockReturnValue(
      objectSchema([property(), property({ key: 'hasEmail', filterOnly: true })]),
    );
    mocked.views.mockReturnValue({ data: { crmViews: [] }, loading: false, refetch: vi.fn() });
  });

  it('puts the schema, query, columns and fetcher together for a list', () => {
    const select = vi.fn();
    const { result } = renderHookWithProviders(() =>
      useRecordList({ object: CrmObject.Lead, document: SearchLeadsDocument, select, columns: COLUMNS }),
    );
    expect(mocked.schema).toHaveBeenCalledWith(CrmObject.Lead);
    expect(result.current.object).toBe(CrmObject.Lead);
    expect(result.current.columnDefs.map((column) => column.colId ?? column.field)).toEqual([
      'name',
      'client',
      'actions',
    ]);
    expect(result.current.snapshot).toEqual({ search: '', groups: [], sorts: [], columns: ['name'] });
    expect(result.current.initialSearch).toBe('');
    expect(result.current.gridKey).toBe(0);
    expect(result.current.refreshSignal).toBe(0);
    expect(typeof result.current.fetchRows).toBe('function');
  });

  it('follows the working query into the snapshot', () => {
    const { result } = renderHookWithProviders(() =>
      useRecordList({ object: CrmObject.Lead, document: SearchLeadsDocument, select: vi.fn(), columns: COLUMNS }),
    );
    act(() => result.current.list.apply({ search: ' acme ' }));
    expect(result.current.snapshot.search).toBe('acme');
    expect(result.current.refreshSignal).toBe(1);
  });
});

describe('withRefreshSignal', () => {
  it('adds the list signal to the dashboard one', () => {
    const crud = { refreshSignal: 2, other: true };
    expect(withRefreshSignal(crud, 3)).toEqual({ refreshSignal: 5, other: true });
  });
});
