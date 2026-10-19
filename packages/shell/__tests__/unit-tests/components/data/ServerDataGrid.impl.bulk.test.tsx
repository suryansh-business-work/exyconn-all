import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { MockLink } from '@apollo/client/testing';
import {
  StartTableBulkJobDocument,
  TableBulkAction,
  TableBulkInfoDocument,
  TableBulkJobDocument,
  TableBulkJobStatus,
  type TableQueryInput,
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

const POLL_WAIT = { timeout: 4_000 };

function jobOf(action: TableBulkAction, total: number, status: TableBulkJobStatus) {
  const done = status === TableBulkJobStatus.Done ? total : 0;
  return {
    __typename: 'TableBulkJob',
    id: 'job1',
    action,
    status,
    total,
    processed: done,
    succeeded: done,
    failedCount: 0,
    failures: [],
    error: null,
  };
}

/** The job queued for `input`, and its progress read back as done on the first poll. */
function bulkJob(input: Record<string, unknown>, total: number) {
  const action = input.action as TableBulkAction;
  const started = answer(
    StartTableBulkJobDocument,
    { startTableBulkJob: jobOf(action, total, TableBulkJobStatus.Queued) },
    { input },
  );
  const finished = answer(
    TableBulkJobDocument,
    { tableBulkJob: jobOf(action, total, TableBulkJobStatus.Done) },
    { id: 'job1' },
  );
  return { mocks: [started.mock, finished.mock], started };
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

beforeEach(() => {
  resetFakeGrid();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ServerDataGridImpl bulk actions', () => {
  it('gives an open list checkboxes, and deletes the selected rows once confirmed', async () => {
    const onBulkDone = vi.fn();
    const deleted = bulkJob({ list: LIST, action: TableBulkAction.Delete, ids: ['l1', 'l2'] }, 2);
    renderBulkGrid([bulkInfo(true, false).mock, ...deleted.mocks], { onBulkDone });

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

    await waitFor(() => expect(deleted.started.delivered()).toBe(true));
    expect(agGrid.deselectAll).toHaveBeenCalled();
    await waitFor(() => expect(onBulkDone).toHaveBeenCalledTimes(1), POLL_WAIT);
    expect(await screen.findByText('2 rows deleted')).toBeInTheDocument();
    // The rows are re-read in place once the job is done: no purge back to skeletons.
    expect(agGrid.refresh).toHaveBeenCalledTimes(1);
    expect(agGrid.purge).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('re-reads the rows but leaves the host alone when the job changed none', async () => {
    const onBulkDone = vi.fn();
    const input = { list: LIST, action: TableBulkAction.Restore, ids: ['l1'] };
    const started = answer(
      StartTableBulkJobDocument,
      { startTableBulkJob: jobOf(TableBulkAction.Restore, 1, TableBulkJobStatus.Queued) },
      { input },
    );
    const failed = answer(
      TableBulkJobDocument,
      {
        tableBulkJob: {
          ...jobOf(TableBulkAction.Restore, 1, TableBulkJobStatus.Failed),
          error: 'Your role may not edit Lead',
        },
      },
      { id: 'job1' },
    );
    renderBulkGrid([bulkInfo(false, true).mock, started.mock, failed.mock], { onBulkDone });
    fireEvent.click(await screen.findByRole('switch', { name: 'Archived' }));
    select('l1');

    fireEvent.click(screen.getByRole('button', { name: 'Restore selected' }));

    expect(
      await screen.findByText('Your role may not edit Lead', {}, POLL_WAIT),
    ).toBeInTheDocument();
    expect(agGrid.refresh).toHaveBeenCalledTimes(1);
    expect(onBulkDone).not.toHaveBeenCalled();
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

  it('hands the server the grid’s query for every matching row, in one job', async () => {
    const onBulkDone = vi.fn();
    const variablesFor = (input: TableQueryInput) => ({ input: { ...input, filters: [] } });
    const deleted = bulkJob(
      {
        list: LIST,
        action: TableBulkAction.Delete,
        variables: {
          input: {
            search: null,
            sort: { field: 'name', dir: 'DESC' },
            sorts: [{ field: 'name', dir: 'DESC' }],
            filters: [],
            page: 0,
            pageSize: 1,
          },
        },
      },
      450,
    );
    const server = serverOf(450);
    renderWithProviders(
      <ServerDataGridImpl
        columnDefs={[{ colId: 'name', headerName: 'Name' }]}
        fetchRows={Object.assign(server, { list: LIST, variablesFor })}
        onBulkDone={onBulkDone}
      />,
      { mocks: [bulkInfo(true, false).mock, ...deleted.mocks] },
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

    await waitFor(() => expect(onBulkDone).toHaveBeenCalledTimes(1), POLL_WAIT);
    expect(deleted.started.delivered()).toBe(true);
    // The browser read one page; the server pages through the rest itself.
    expect(server).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('450 rows deleted')).toBeInTheDocument();
  });

  it('leaves “all matching” when a row is ticked or the sort changes', async () => {
    const server = Object.assign(serverOf(60), { variablesFor: () => ({}) });
    renderBulkGrid([bulkInfo(true, false).mock], {}, server);
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
