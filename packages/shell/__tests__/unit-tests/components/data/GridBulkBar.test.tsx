import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '@exyconn/i18n';
import { TableBulkAction } from '@/graphql/generated';
import { GridBulkBar, GridBulkControls } from '@/components/data/GridBulkBar';
import type { TableBulk } from '@/components/data/useTableBulk';

const { run } = vi.hoisted(() => ({ run: vi.fn() }));

vi.mock('@/components/data/useBulkRun', () => ({ useBulkRun: () => run }));

function makeBulk(patch: Partial<TableBulk> = {}): TableBulk {
  return {
    list: 'listLeadsPaged',
    selectedIds: ['l1', 'l2'],
    deletable: true,
    archivable: true,
    enabled: true,
    selectedCount: 2,
    busy: false,
    setBusy: vi.fn(),
    reload: vi.fn(),
    archived: false,
    archivedRef: { current: false },
    setArchived: vi.fn(),
    onSelectionChanged: vi.fn(),
    clearSelection: vi.fn(),
    selectPage: vi.fn(),
    ...patch,
  };
}

function renderBar(bulk: TableBulk, loading = false) {
  return render(
    <I18nProvider locale="en" messages={{}}>
      <GridBulkControls bulk={bulk} loading={loading} />
      <GridBulkBar bulk={bulk} loading={loading} />
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

  it('locks every control while a bulk request runs', () => {
    renderBar(makeBulk({ busy: true }));

    expect(screen.getByRole('button', { name: 'Select page' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Archived' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete selected' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Archive selected' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear selection' })).toBeDisabled();
    expect(screen.getByRole('status').parentElement).toHaveAttribute('aria-busy', 'true');
  });

  it('locks every control while the grid loads a page', () => {
    renderBar(makeBulk(), true);

    expect(screen.getByRole('button', { name: 'Select page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete selected' })).toBeDisabled();
  });
});
