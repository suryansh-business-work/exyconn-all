import { act, render } from '@testing-library/react';
import type { IGetRowsParams } from 'ag-grid-community';
import { vi } from 'vitest';
import { I18nProvider } from '@exyconn/i18n';
import type { TableQueryInput } from '@/graphql/generated';
import ServerDataGridImpl, { type TablePageResult } from '@/components/data/ServerDataGrid.impl';
import { agGrid } from './fakeAgGrid';

/** The grid's page loader, as a page passes it. */
export type Fetch = (input: TableQueryInput) => Promise<TablePageResult<unknown>>;

export function getRowsParams(patch: Partial<IGetRowsParams> = {}): IGetRowsParams {
  const params: Omit<IGetRowsParams, 'api'> = {
    startRow: 0,
    endRow: 25,
    sortModel: [],
    filterModel: {},
    successCallback: vi.fn(),
    failCallback: vi.fn(),
    context: undefined,
  };
  return { ...params, ...patch } as IGetRowsParams;
}

export function renderGrid(fetchRows: Fetch, extra: Record<string, unknown> = {}) {
  return render(
    <I18nProvider locale="en" messages={{ Name: 'Nombre', 'Search…': 'Buscar…' }}>
      <ServerDataGridImpl
        columnDefs={[{ colId: 'name', headerName: 'Name' }, { colId: 'code' }]}
        fetchRows={fetchRows}
        {...extra}
      />
    </I18nProvider>,
  );
}

/** Asks the grid's datasource for a page and lets the request settle. */
export async function loadPage(params: IGetRowsParams) {
  await act(async () => {
    agGrid.datasource?.getRows(params);
    await Promise.resolve();
  });
}
