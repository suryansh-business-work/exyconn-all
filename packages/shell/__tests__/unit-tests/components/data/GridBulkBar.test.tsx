import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '@exyconn/i18n';
import { TableBulkAction, TableBulkJobStatus } from '@/graphql/generated';
import { GridBulkBar, GridBulkControls } from '@/components/data/GridBulkBar';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import type { TableBulk } from '@/components/data/useTableBulk';

const { run } = vi.hoisted(() => ({ run: vi.fn() }));

vi.mock('@/components/data/useBulkRun', () => ({ useBulkRun: () => run }));

function makeBulk(patch: Partial<TableBulk> = {}): TableBulk {
  return {
    list: 'listLeadsPaged',
    fetchRows: vi.fn(),
    selectedIds: ['l1', 'l2'],
    deletable: true,
    archivable: true,
    enabled: true,
    canSelectAll: true,
    selectedCount: 2,
    job: {
      job: null,
      running: false,
      finished: null,
      visible: false,
      dismiss: vi.fn(),
      start: vi.fn(),
    },
    archived: false,
    archivedRef: { current: false },
    setArchived: vi.fn(),
    onSelectionChanged: vi.fn(),
    clearSelection: vi.fn(),
    selectPage: vi.fn(),
    matching: null,
    setMatching: vi.fn(),
    allMatching: false,
    selectAllMatching: vi.fn(),
    ...patch,
  };
}

function renderBar(bulk: TableBulk, loading = false) {
  return render(
    <I18nProvider locale="en" messages={{}}>
      <NotificationProvider>
        <GridBulkControls bulk={bulk} loading={loading} />
        <GridBulkBar bulk={bulk} loading={loading} />
      </NotificationProvider>
    </I18nProvider>,
  );
}

beforeEach(() => {
  run.mockReset();
});

describe('GridBulkControls', () => {
  it('selects the page and flips the Archived switch', () => {
    const bulk = makeBulk();
    renderBar(bulk);

    fireEvent.click(screen.getByRole('button', { name: 'Select page' }));
    expect(bulk.selectPage).toHaveBeenCalledTimes(1);

    const archived = screen.getByRole('switch', { name: 'Archived' });
    expect(archived).not.toBeChecked();
    fireEvent.click(archived);
    expect(bulk.setArchived).toHaveBeenCalledWith(true);
  });

  it('has no Archived switch on a list that cannot be archived', () => {
    renderBar(makeBulk({ archivable: false }));
    expect(screen.queryByRole('switch', { name: 'Archived' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archive selected' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete selected' })).toBeInTheDocument();
  });
});

describe('GridBulkBar', () => {
  it('announces the count and runs delete and archive on the selection', () => {
    const bulk = makeBulk();
    renderBar(bulk);

    expect(screen.getByRole('status')).toHaveTextContent('2 selected');
    fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }));
    expect(run).toHaveBeenCalledWith(TableBulkAction.Delete);
    fireEvent.click(screen.getByRole('button', { name: 'Archive selected' }));
    expect(run).toHaveBeenCalledWith(TableBulkAction.Archive);
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(bulk.clearSelection).toHaveBeenCalledTimes(1);
  });

  it('offers Restore selected while the archived rows are shown', () => {
    renderBar(makeBulk({ archived: true, deletable: false }));

    expect(screen.getByRole('switch', { name: 'Archived' })).toBeChecked();
    expect(screen.queryByRole('button', { name: 'Delete selected' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restore selected' }));
    expect(run).toHaveBeenCalledWith(TableBulkAction.Restore);
  });

  it('shows no actions and an empty status with nothing selected', () => {
    renderBar(makeBulk({ selectedIds: [], selectedCount: 0 }));

    expect(screen.getByRole('status')).toHaveTextContent('');
    expect(screen.queryByRole('button', { name: 'Delete selected' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
  });

  it('holds back only the bulk actions while a job runs, showing its progress', () => {
    const job = {
      id: 'j1',
      action: TableBulkAction.Archive,
      status: TableBulkJobStatus.Running,
      total: 1240,
      processed: 400,
      succeeded: 400,
      failedCount: 0,
      failures: [],
    };
    renderBar(
      makeBulk({
        job: {
          job,
          running: true,
          finished: null,
          visible: true,
          dismiss: vi.fn(),
          start: vi.fn(),
        },
      }),
    );

    expect(screen.getByRole('button', { name: 'Select page' })).toBeEnabled();
    expect(screen.getByRole('switch', { name: 'Archived' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Clear selection' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Delete selected' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Archive selected' })).toBeDisabled();
    expect(screen.getByText('Archiving 400 of 1,240…')).toBeInTheDocument();
  });

  it('locks every control while the grid loads a page', () => {
    renderBar(makeBulk(), true);

    expect(screen.getByRole('button', { name: 'Select page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete selected' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear selection' })).toBeDisabled();
  });

  it('offers every row the current query matches, and announces once they are chosen', () => {
    const matching = { query: { search: null, sort: null, sorts: [], filters: [] }, total: 1240 };
    const bulk = makeBulk({ matching });
    const { rerender } = renderBar(bulk);

    fireEvent.click(screen.getByRole('button', { name: 'Select all 1,240 matching' }));
    expect(bulk.selectAllMatching).toHaveBeenCalledTimes(1);

    const chosen = makeBulk({ matching, allMatching: true });
    rerender(
      <I18nProvider locale="en" messages={{}}>
        <NotificationProvider>
          <GridBulkBar bulk={chosen} loading={false} />
        </NotificationProvider>
      </I18nProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('All 1,240 matching rows are selected');
    expect(screen.queryByRole('button', { name: /Select all/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear selection' })).toBeInTheDocument();
  });

  it('has nothing more to offer when the ticked rows are all that match', () => {
    const matching = { query: { search: null, sort: null, sorts: [], filters: [] }, total: 2 };
    renderBar(makeBulk({ matching }));
    expect(screen.queryByRole('button', { name: /Select all/ })).not.toBeInTheDocument();
  });

  it('does not offer every matching row when the fetcher cannot hand the server its query', () => {
    const matching = { query: { search: null, sort: null, sorts: [], filters: [] }, total: 90 };
    renderBar(makeBulk({ matching, canSelectAll: false }));
    expect(screen.queryByRole('button', { name: /Select all/ })).not.toBeInTheDocument();
  });
});
