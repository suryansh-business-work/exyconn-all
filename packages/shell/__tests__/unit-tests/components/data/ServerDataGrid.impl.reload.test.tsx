import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { I18nProvider } from '@exyconn/i18n';
import ServerDataGridImpl from '@/components/data/ServerDataGrid.impl';
import { agGrid, resetFakeGrid } from './fakeAgGrid';
import { getRowsParams, loadPage, renderGrid, type Fetch } from './serverGridHarness';

vi.mock('ag-grid-react', async () => {
  const { FakeAgGrid } = await import('./fakeAgGrid');
  return { AgGridReact: FakeAgGrid };
});

beforeEach(() => {
  resetFakeGrid();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ServerDataGridImpl reloads', () => {
  it('debounces the search box and reloads only when the trimmed text changes', async () => {
    vi.useFakeTimers();
    const fetchRows = vi.fn<Fetch>().mockResolvedValue({ rows: [], totalCount: 0 });
    renderGrid(fetchRows);
    const box = screen.getByRole('textbox', { name: 'Buscar…' });

    fireEvent.change(box, { target: { value: ' acme ' } });
    act(() => vi.advanceTimersByTime(299));
    expect(agGrid.purge).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(agGrid.purge).toHaveBeenCalledTimes(1);

    fireEvent.change(box, { target: { value: 'acme' } });
    act(() => vi.advanceTimersByTime(300));
    expect(agGrid.purge).toHaveBeenCalledTimes(1);

    await loadPage(getRowsParams());
    expect(fetchRows).toHaveBeenCalledWith(expect.objectContaining({ search: 'acme' }));
  });

  it('reloads on the refresh button and on a bumped refresh signal', () => {
    const fetchRows = vi.fn<Fetch>();
    const { rerender } = renderGrid(fetchRows, { refreshSignal: 0 });
    expect(agGrid.purge).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(agGrid.purge).toHaveBeenCalledTimes(1);

    rerender(
      <I18nProvider locale="en" messages={{}}>
        <ServerDataGridImpl columnDefs={[]} fetchRows={fetchRows} refreshSignal={1} />
      </I18nProvider>,
    );
    expect(agGrid.purge).toHaveBeenCalledTimes(2);
  });

  it('does nothing on refresh before the grid api exists', () => {
    agGrid.withApi = false;
    renderGrid(vi.fn());
    fireEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(agGrid.purge).not.toHaveBeenCalled();
  });
});

describe('ServerDataGridImpl row clicks', () => {
  it('opens a loaded row and ignores a placeholder row', () => {
    const onRowClick = vi.fn();
    renderGrid(vi.fn(), { onRowClick });

    expect(agGrid.props.rowStyle).toEqual({ cursor: 'pointer' });
    act(() => agGrid.props.onRowClicked?.({ data: { id: 'r1' } }));
    act(() => agGrid.props.onRowClicked?.({ data: undefined }));

    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith({ id: 'r1' });
  });
});
