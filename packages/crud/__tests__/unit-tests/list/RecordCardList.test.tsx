import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordCardList } from '../../../src/list/RecordCardList';
import { renderWithProviders } from '../test-utils';
import {
  answering,
  deferred,
  lead,
  leadColumns,
  type FetchLeads,
  type Lead,
} from './cardListFixtures';
import type { TablePageResult } from '@exyconn/shell/components/data/ServerDataGrid';

const t = (source: string) => source;

const renderList = (fetchRows: FetchLeads, onRowClick?: (row: Lead) => void) =>
  renderWithProviders(
    <RecordCardList<Lead>
      columnDefs={leadColumns}
      fetchRows={fetchRows}
      context={{ t }}
      searchPlaceholder="Search leads"
      onRowClick={onRowClick}
    />,
  );

describe('RecordCardList loading and paging', () => {
  it('shows a placeholder card until the first page arrives, then the cards', async () => {
    const page = deferred<TablePageResult<Lead>>();
    const fetchRows = vi.fn<FetchLeads>(() => page.promise);
    const { container } = renderList(fetchRows);

    expect(fetchRows).toHaveBeenCalledWith({ page: 0, pageSize: 20, search: null });
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeNull();
    expect(screen.getByRole('textbox', { name: 'Search leads' })).toBeInTheDocument();

    page.resolve({ rows: [lead(1), lead(2, false)], totalCount: 2 });
    expect(await screen.findByText('Lead 1')).toBeInTheDocument();
    expect(screen.getByText('Lead 2')).toBeInTheDocument();
    expect(container.querySelector('.MuiSkeleton-root')).toBeNull();
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
    // Everything is loaded, so there is nothing more to ask for.
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it("formats a date fact through the viewer's settings, which the page did not pass", async () => {
    renderList(answering([lead(1)], 1));
    expect(await screen.findByText('Created')).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('appends the next page on Load more, disabled while it loads', async () => {
    const next = deferred<TablePageResult<Lead>>();
    const fetchRows = vi
      .fn<FetchLeads>()
      .mockResolvedValueOnce({ rows: [lead(1)], totalCount: 2 })
      .mockReturnValueOnce(next.promise);
    renderList(fetchRows);

    await userEvent.click(await screen.findByRole('button', { name: 'Load more' }));
    expect(fetchRows).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, search: null });
    expect(screen.getByRole('button', { name: 'Load more' })).toBeDisabled();

    next.resolve({ rows: [lead(2)], totalCount: 2 });
    expect(await screen.findByText('Lead 2')).toBeInTheDocument();
    expect(screen.getByText('Lead 1')).toBeInTheDocument();
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
  });

  it('says so when there is nothing to show', async () => {
    renderList(answering([], 0));
    expect(await screen.findByText('Nothing to show yet.')).toBeInTheDocument();
    expect(screen.queryByText(/ of /)).not.toBeInTheDocument();
  });

  it('shows the error instead of the empty state when a page fails', async () => {
    renderList(vi.fn<FetchLeads>(() => Promise.reject(new Error('Server is down'))));
    expect(await screen.findByText('Server is down')).toBeInTheDocument();
    expect(screen.queryByText('Nothing to show yet.')).not.toBeInTheDocument();
  });

  it('falls back to a general message for a failure that is not an Error', async () => {
    const notAnError: unknown = 'offline';
    renderList(vi.fn<FetchLeads>(() => Promise.reject(notAnError)));
    expect(await screen.findByText('Could not load this list')).toBeInTheDocument();
  });

  it('opens a record from its card', async () => {
    const onRowClick = vi.fn();
    renderList(answering([lead(1)], 1), onRowClick);
    await userEvent.click(await screen.findByRole('button', { name: 'Lead 1' }));
    expect(onRowClick).toHaveBeenCalledWith(lead(1));
  });
});
