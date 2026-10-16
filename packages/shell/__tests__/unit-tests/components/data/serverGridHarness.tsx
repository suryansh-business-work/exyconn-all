import { act, render } from '@testing-library/react';
import type { IGetRowsParams } from 'ag-grid-community';
import { vi } from 'vitest';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { I18nProvider } from '@exyconn/i18n';
import type { TableQueryInput } from '@/graphql/generated';
import ServerDataGridImpl, {
  type GridFetcher,
  type TablePageResult,
} from '@/components/data/ServerDataGrid.impl';
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

/** A page loader that names the paged list it reads, as `usePagedFetcher` builds one. */
export function listFetcher(fetch: Fetch, list: string): GridFetcher<unknown> {
  return Object.assign(fetch, { list });
}

export function renderGrid(
  fetchRows: GridFetcher<unknown>,
  extra: Record<string, unknown> = {},
  mocks: ReadonlyArray<MockLink.MockedResponse> = [],
) {
  return render(
    <MockedProvider mocks={mocks}>
      <I18nProvider
        locale="en"
        messages={{ Name: 'Nombre', 'Search…': 'Buscar…' }}
        settings={{ timezone: 'Asia/Kolkata' }}
      >
        <ServerDataGridImpl
          columnDefs={[{ colId: 'name', headerName: 'Name' }, { colId: 'code' }]}
          fetchRows={fetchRows}
          {...extra}
        />
      </I18nProvider>
    </MockedProvider>,
  );
}

/** Asks the grid's datasource for a page and lets the request settle. */
export async function loadPage(params: IGetRowsParams) {
  await act(async () => {
    agGrid.datasource?.getRows(params);
    await Promise.resolve();
  });
}
