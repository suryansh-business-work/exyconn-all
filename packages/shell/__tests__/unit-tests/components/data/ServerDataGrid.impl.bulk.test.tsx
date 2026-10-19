import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { MockLink } from '@apollo/client/testing';
import {
  TableBulkAction,
  TableBulkActionDocument,
  TableBulkInfoDocument,
} from '@/graphql/generated';
import ServerDataGridImpl from '@/components/data/ServerDataGrid.impl';
import { portalLogger } from '@/logging/portalLogger';
import { agGrid, resetFakeGrid } from './fakeAgGrid';
import { getRowsParams, listFetcher, loadPage, type Fetch } from './serverGridHarness';
import { answer, failure } from '../../mockResult';
import { renderWithProviders } from '../../test-utils';

vi.mock('ag-grid-react', async () => {
  const { FakeAgGrid } = await import('./fakeAgGrid');
  return { AgGridReact: FakeAgGrid };
});

const LIST = 'listLeadsPaged';

function bulkInfo(deletable: boolean, archivable: boolean, list = LIST) {
  return answer(
    TableBulkInfoDocument,
    { tableBulkInfo: { __typename: 'TableBulkInfo', deletable, archivable } },
    { list },
  );
}

function bulkAction(ids: string[], action: TableBulkAction, succeeded: number) {
  return answer(
    TableBulkActionDocument,
    { tableBulkAction: { __typename: 'TableBulkResult', succeeded, failures: [] } },
    { list: LIST, ids, action },
  );
}

function renderBulkGrid(
  mocks: ReadonlyArray<MockLink.MockedResponse>,
  extra: Record<string, unknown> = {},
  fetchRows = vi.fn<Fetch>().mockResolvedValue({ rows: [], totalCount: 0 }),
) {
  renderWithProviders(
    <ServerDataGridImpl
      columnDefs={[{ colId: 'name', headerName: 'Name' }]}
      fetchRows={listFetcher(fetchRows, LIST)}
      {...extra}
    />,
    { mocks },
  );
  return fetchRows;
}

function select(...ids: string[]) {
  act(() =>
    agGrid.props.onSelectionChanged({
      api: { getSelectedRows: () => ids.map((id) => ({ id })) },
    }),
  );
}

/** A server holding `total` matching rows `r1…`, serving whichever page is asked for. */
function serverOf(total: number) {
  return vi.fn<Fetch>(async ({ page, pageSize }) => {
    const start = page * pageSize;
    const count = Math.max(0, Math.min(pageSize, total - start));
    const rows = Array.from({ length: count }, (_, index) => ({ id: `r${start + index + 1}` }));
    return { rows, totalCount: total };
  });
}

function idsFrom(first: number, last: number): string[] {
  return Array.from({ length: last - first + 1 }, (_, index) => `r${first + index}`);
}

beforeEach(() => {
  resetFakeGrid();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ServerDataGridImpl bulk actions', () => {
  it('gives an open list checkboxes, and deletes the selected rows once confirmed', async () => {
    const onBulkDone = vi.fn();
    const deleted = bulkAction(['l1', 'l2'], TableBulkAction.Delete, 2);
    renderBulkGrid([bulkInfo(true, false).mock, deleted.mock], { onBulkDone });

    await screen.findByRole('button', { name: 'Select page' });
    expect(agGrid.props.rowSelection).toEqual({
      mode: 'multiRow',
      checkboxes: true,
      headerCheckbox: false,
    });
    select('l1', 'l2');
    expect(screen.getByRole('status')).toHaveTextContent('2 selected');

    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Delete 2 selected rows? This cannot be undone.');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(onBulkDone).toHaveBeenCalledTimes(1));
    expect(deleted.delivered()).toBe(true);
    expect(await screen.findByText('2 rows deleted')).toBeInTheDocument();
    expect(agGrid.deselectAll).toHaveBeenCalled();
    expect(agGrid.purge).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('asks the server about the bulk list the page names rather than the fetcher’s', async () => {
    const info = bulkInfo(false, true, 'searchContacts');
    renderBulkGrid([info.mock], { bulkList: 'searchContacts' });

    expect(await screen.findByRole('switch', { name: 'Archived' })).toBeInTheDocument();
    expect(info.delivered()).toBe(true);
  });

  it('lists archived rows while the switch is on, dropping the selection', async () => {
    const fetchRows = renderBulkGrid([bulkInfo(false, true).mock]);
    const archived = await screen.findByRole('switch', { name: 'Archived' });
    select('l1');

    fireEvent.click(archived);
    expect(agGrid.purge).toHaveBeenCalledTimes(1);
    expect(agGrid.deselectAll).toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('');
    await loadPage(getRowsParams());
    expect(fetchRows).toHaveBeenLastCalledWith(expect.objectContaining({ archived: true }));

    fireEvent.click(archived);
    await loadPage(getRowsParams());
    expect(fetchRows).toHaveBeenLastCalledWith(expect.not.objectContaining({ archived: true }));
    expect(fetchRows.mock.lastCall?.[0].archived).toBeUndefined();
  });

  it('selects every loaded row on the page the pager shows', async () => {
    renderBulkGrid([bulkInfo(true, true).mock], { pageSize: 2 });
    const selectPage = await screen.findByRole('button', { name: 'Select page' });
    // Page two holds one loaded row and one still loading; nothing lies beyond it.
    agGrid.currentPage = 1;
    agGrid.rows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, null];

    fireEvent.click(selectPage);
    expect(agGrid.setNodesSelected).toHaveBeenCalledWith({
      nodes: [{ data: { id: 'c' } }],
      newValue: true,
    });

    agGrid.currentPage = 2;
    fireEvent.click(selectPage);
    expect(agGrid.setNodesSelected).toHaveBeenLastCalledWith({ nodes: [], newValue: true });
  });

  it('does nothing on Select page before the grid has started', async () => {
    agGrid.withApi = false;
    renderBulkGrid([bulkInfo(true, false).mock]);

    fireEvent.click(await screen.findByRole('button', { name: 'Select page' }));
    expect(agGrid.setNodesSelected).not.toHaveBeenCalled();
  });

  it('drops the selection when the sort or the filters change', async () => {
    renderBulkGrid([bulkInfo(true, false).mock]);
    await screen.findByRole('button', { name: 'Select page' });

    select('l1');
    act(() => agGrid.props.onSortChanged());
    expect(screen.getByRole('status')).toHaveTextContent('');

    select('l1');
    act(() => agGrid.props.onFilterChanged({ api: { isAnyFilterPresent: () => true } }));
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('offers no selection on a list closed to bulk actions', async () => {
    const info = bulkInfo(false, false);
    renderBulkGrid([info.mock]);

    await waitFor(() => expect(info.delivered()).toBe(true));
    expect(screen.queryByRole('button', { name: 'Select page' })).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(agGrid.props.rowSelection).toBeUndefined();
  });

  it('logs when the server cannot say which bulk actions the list offers', async () => {
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    renderBulkGrid([failure(TableBulkInfoDocument, { list: LIST })]);

    await waitFor(() =>
      expect(logged).toHaveBeenCalledWith(
        'Could not load which bulk actions the grid offers',
        expect.any(Error),
        { list: LIST },
      ),
    );
    expect(screen.queryByRole('button', { name: 'Select page' })).not.toBeInTheDocument();
  });

  it('selects every row the current query matches and deletes them all, page by page', async () => {
    const onBulkDone = vi.fn();
    const chunks = [idsFrom(1, 200), idsFrom(201, 400), idsFrom(401, 450)].map((ids) =>
      bulkAction(ids, TableBulkAction.Delete, ids.length),
    );
    const fetchRows = renderBulkGrid(
      [bulkInfo(true, false).mock, ...chunks.map((chunk) => chunk.mock)],
      { onBulkDone },
      serverOf(450),
    );
    await screen.findByRole('button', { name: 'Select page' });
    await loadPage(getRowsParams({ sortModel: [{ colId: 'name', sort: 'desc' }] }));
    select('r1', 'r2');

    fireEvent.click(screen.getByRole('button', { name: 'Select all 450 matching' }));
    expect(screen.getByRole('status')).toHaveTextContent('All 450 matching rows are selected');

    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(
      'Delete 450 rows matching the current filters? This cannot be undone.',
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(onBulkDone).toHaveBeenCalledTimes(1));
    expect(chunks.every((chunk) => chunk.delivered())).toBe(true);
    expect(fetchRows).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        pageSize: 200,
        sorts: [{ field: 'name', dir: 'DESC' }],
      }),
    );
    expect(await screen.findByText('450 rows deleted')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('leaves “all matching” when a row is ticked or the sort changes', async () => {
    renderBulkGrid([bulkInfo(true, false).mock], {}, serverOf(60));
    await screen.findByRole('button', { name: 'Select page' });
    await loadPage(getRowsParams());

    select('r1');
    fireEvent.click(screen.getByRole('button', { name: 'Select all 60 matching' }));
    select('r1', 'r2');
    expect(screen.getByRole('status')).toHaveTextContent('2 selected');

    fireEvent.click(screen.getByRole('button', { name: 'Select all 60 matching' }));
    act(() => agGrid.props.onSortChanged());
    expect(screen.getByRole('status')).toHaveTextContent('');
    expect(screen.queryByRole('button', { name: /Select all/ })).not.toBeInTheDocument();
  });
});
