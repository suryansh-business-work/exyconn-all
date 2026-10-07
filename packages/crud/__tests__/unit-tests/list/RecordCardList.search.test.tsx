import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { TablePageResult } from '@exyconn/shell/components/data/ServerDataGrid';
import { RecordCardList } from '../../../src/list/RecordCardList';
import { createWrapper } from '../test-utils';
import {
  answering,
  deferred,
  lead,
  leadColumns,
  type FetchLeads,
  type Lead,
} from './cardListFixtures';

const context = { t: (source: string) => source };

const list = (fetchRows: FetchLeads, refreshSignal?: number) => (
  <RecordCardList<Lead>
    columnDefs={leadColumns}
    fetchRows={fetchRows}
    context={context}
    searchPlaceholder="Search leads"
    refreshSignal={refreshSignal}
  />
);

const renderList = (fetchRows: FetchLeads, refreshSignal?: number) =>
  render(list(fetchRows, refreshSignal), { wrapper: createWrapper() });

afterEach(() => {
  vi.useRealTimers();
});

describe('RecordCardList search and reloads', () => {
  it('waits for typing to rest, then asks the server for the trimmed search from the top', async () => {
    const fetchRows = answering([lead(1)], 1);
    renderList(fetchRows);
    expect(await screen.findByText('Lead 1')).toBeInTheDocument();

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.change(screen.getByRole('textbox', { name: 'Search leads' }), {
      target: { value: '  acme ' },
    });
    act(() => {
      vi.advanceTimersByTime(349);
    });
    expect(fetchRows).toHaveBeenCalledTimes(1);
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(fetchRows).toHaveBeenCalledTimes(2);
    expect(fetchRows).toHaveBeenLastCalledWith({ page: 0, pageSize: 20, search: 'acme' });
  });

  it('replaces the cards with the first page of a new search', async () => {
    const fetchRows = vi
      .fn<FetchLeads>()
      .mockResolvedValueOnce({ rows: [lead(1)], totalCount: 1 })
      .mockResolvedValueOnce({ rows: [lead(2)], totalCount: 1 });
    renderList(fetchRows);
    expect(await screen.findByText('Lead 1')).toBeInTheDocument();

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.change(screen.getByRole('textbox', { name: 'Search leads' }), {
      target: { value: 'two' },
    });
    await act(async () => {
      vi.advanceTimersByTime(350);
    });
    vi.useRealTimers();
    expect(await screen.findByText('Lead 2')).toBeInTheDocument();
    expect(screen.queryByText('Lead 1')).not.toBeInTheDocument();
  });

  it('reloads from the first page when the refresh signal is bumped', async () => {
    const fetchRows = answering([lead(1)], 1);
    const { rerender } = renderList(fetchRows, 0);
    expect(await screen.findByText('Lead 1')).toBeInTheDocument();
    rerender(list(fetchRows, 1));
    expect(fetchRows).toHaveBeenCalledTimes(2);
    expect(fetchRows).toHaveBeenLastCalledWith({ page: 0, pageSize: 20, search: null });
  });

  it('ignores a page that answers after a newer request replaced it', async () => {
    const stale = deferred<TablePageResult<Lead>>();
    const fresh = deferred<TablePageResult<Lead>>();
    const fetchRows = vi
      .fn<FetchLeads>()
      .mockReturnValueOnce(stale.promise)
      .mockReturnValueOnce(fresh.promise);
    const { rerender } = renderList(fetchRows, 0);
    rerender(list(fetchRows, 1));

    fresh.resolve({ rows: [lead(2)], totalCount: 1 });
    expect(await screen.findByText('Lead 2')).toBeInTheDocument();
    await act(async () => {
      stale.resolve({ rows: [lead(1)], totalCount: 1 });
      await stale.promise;
    });
    expect(screen.queryByText('Lead 1')).not.toBeInTheDocument();
    expect(screen.getByText('1 of 1')).toBeInTheDocument();
  });

  it('ignores a failure from a request that was replaced, and keeps loading the new one', async () => {
    const stale = deferred<TablePageResult<Lead>>();
    const fresh = deferred<TablePageResult<Lead>>();
    const fetchRows = vi
      .fn<FetchLeads>()
      .mockReturnValueOnce(stale.promise)
      .mockReturnValueOnce(fresh.promise);
    const { rerender, container } = renderList(fetchRows, 0);
    rerender(list(fetchRows, 1));

    await act(async () => {
      stale.reject(new Error('Stale failure'));
      await stale.promise.catch(() => undefined);
    });
    expect(screen.queryByText('Stale failure')).not.toBeInTheDocument();
    // The replaced request settling must not end the newer one's loading state.
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeNull();

    fresh.resolve({ rows: [lead(3)], totalCount: 1 });
    expect(await screen.findByText('Lead 3')).toBeInTheDocument();
  });
});
