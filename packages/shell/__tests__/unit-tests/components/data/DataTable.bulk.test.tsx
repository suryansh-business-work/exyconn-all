import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { I18nProvider } from '@exyconn/i18n';
import { ConfirmProvider } from '@/components/feedback/ConfirmProvider';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { DataTable, type Column } from '@/components/data/DataTable';
import {
  StartTableBulkJobDocument,
  TableBulkAction,
  TableBulkJobDocument,
  TableBulkJobStatus,
} from '@/graphql/generated';
import { portalLogger } from '@/logging/portalLogger';
import { answer, failure } from '../../mockResult';

interface Holiday {
  __typename?: string;
  id: string;
  name: string;
}

const rows: Holiday[] = [
  { __typename: 'Holiday', id: 'h1', name: 'New Year' },
  { __typename: 'Holiday', id: 'h2', name: 'Diwali' },
  { id: 'h3', name: 'Untyped' },
];
const columns: Column<Holiday>[] = [{ key: 'name', label: 'Name' }];
const ALL = { entity: 'Holiday', action: TableBulkAction.Delete, ids: ['h1', 'h2', 'h3'] };
const POLL_WAIT = { timeout: 4_000 };

function job(status: TableBulkJobStatus, failures: Array<{ id: string; message: string }> = []) {
  const done = status === TableBulkJobStatus.Done;
  return {
    __typename: 'TableBulkJob',
    id: 'job1',
    action: TableBulkAction.Delete,
    status,
    total: 3,
    processed: done ? 3 : 0,
    succeeded: done ? 3 - failures.length : 0,
    failedCount: failures.length,
    failures: failures.map((item) => ({ __typename: 'TableBulkFailure', ...item })),
    error: null,
  };
}

function renderBulkTable(
  mocks: ReadonlyArray<MockLink.MockedResponse> = [],
  extra: {
    loading?: boolean;
    tableRows?: Holiday[];
    selectionActions?: (ids: readonly string[]) => React.ReactNode;
  } = {},
) {
  const cache = new InMemoryCache();
  const evict = vi.spyOn(cache, 'evict');
  const gc = vi.spyOn(cache, 'gc');
  const onRowClick = vi.fn();
  render(
    <MockedProvider mocks={mocks} cache={cache}>
      <I18nProvider locale="en" messages={{}}>
        <NotificationProvider>
          <ConfirmProvider>
            <DataTable
              columns={columns}
              rows={extra.tableRows ?? rows}
              loading={extra.loading}
              onDelete={vi.fn()}
              onRowClick={onRowClick}
              bulkEntity="Holiday"
              selectionActions={extra.selectionActions}
            />
          </ConfirmProvider>
        </NotificationProvider>
      </I18nProvider>
    </MockedProvider>,
  );
  return { evict, gc, onRowClick };
}

/** The table's own "{count} selected" line (the job's progress line is a status too). */
const selection = () => screen.getAllByRole('status')[0];
const selectAll = () => screen.getByRole('checkbox', { name: 'Select all rows' });
const rowBoxes = () => screen.getAllByRole('checkbox', { name: 'Select row' });

async function confirmDelete() {
  fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }));
  const dialog = await screen.findByRole('dialog');
  expect(dialog).toHaveTextContent('Delete 3 selected rows? This cannot be undone.');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DataTable bulk delete', () => {
  it('ticks rows one at a time or all together, without opening them', () => {
    const { onRowClick } = renderBulkTable();
    expect(selection()).toHaveTextContent('');

    fireEvent.click(rowBoxes()[0]);
    expect(selection()).toHaveTextContent('1 selected');
    expect(selectAll()).toHaveAttribute('data-indeterminate', 'true');
    expect(onRowClick).not.toHaveBeenCalled();

    fireEvent.click(rowBoxes()[0]);
    expect(selection()).toHaveTextContent('');

    fireEvent.click(selectAll());
    expect(selection()).toHaveTextContent('3 selected');
    expect(selectAll()).toBeChecked();
    fireEvent.click(selectAll());
    expect(selection()).toHaveTextContent('');

    fireEvent.click(selectAll());
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.queryByRole('button', { name: 'Delete selected' })).not.toBeInTheDocument();
  });

  it("draws the page's own buttons for the ticked rows, only while any are ticked", () => {
    const picked = vi.fn();
    renderBulkTable([], {
      selectionActions: (ids) => (
        <button type="button" onClick={() => picked(ids)}>
          Export selected
        </button>
      ),
    });
    expect(screen.queryByRole('button', { name: 'Export selected' })).not.toBeInTheDocument();
    fireEvent.click(rowBoxes()[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Export selected' }));
    expect(picked).toHaveBeenCalledWith(['h2']);
  });

  it('deletes the selection as one job, then drops the rows that went from the cache', async () => {
    const started = answer(
      StartTableBulkJobDocument,
      { startTableBulkJob: job(TableBulkJobStatus.Queued) },
      { input: ALL },
    );
    const finished = answer(
      TableBulkJobDocument,
      { tableBulkJob: job(TableBulkJobStatus.Done, [{ id: 'h2', message: 'In use' }]) },
      { id: 'job1' },
    );
    const { evict, gc } = renderBulkTable([started.mock, finished.mock]);
    fireEvent.click(selectAll());

    await confirmDelete();

    expect(selection()).toHaveTextContent('');
    expect(await screen.findByText('2 done, 1 failed: In use', {}, POLL_WAIT)).toBeInTheDocument();
    // The untyped row has no cache id, and the row that stayed is not touched.
    expect(evict).toHaveBeenCalledTimes(1);
    expect(evict).toHaveBeenCalledWith({ id: 'Holiday:h1' });
    expect(gc).toHaveBeenCalled();
  });

  it('does nothing when the person cancels the confirm', async () => {
    renderBulkTable();
    fireEvent.click(selectAll());

    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }));
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(selection()).toHaveTextContent('3 selected');
  });

  it('logs and reports a job the server refuses, keeping the selection', async () => {
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    renderBulkTable([failure(StartTableBulkJobDocument, { input: ALL }, 'Forbidden')]);
    fireEvent.click(selectAll());

    await confirmDelete();

    expect(await screen.findByText('Forbidden')).toBeInTheDocument();
    expect(logged).toHaveBeenCalledWith('Could not start the bulk delete', expect.any(Error), {
      entity: 'Holiday',
    });
    expect(selection()).toHaveTextContent('3 selected');
  });

  it('draws a placeholder for the checkbox column, and a header box with nothing to tick', () => {
    renderBulkTable([], { loading: true, tableRows: [] });

    const [skeleton] = screen.getAllByTestId('table-skeleton-row');
    expect(within(skeleton).getAllByRole('cell')).toHaveLength(3);
    expect(selectAll()).toBeDisabled();
  });
});
