import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AppLogStatus,
  FilterOp,
  ListAppLogGroupsPagedDocument,
} from '@exyconn/shell/graphql/generated';
import { LogsPage } from '../../../../src/pages/logs';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps, paged, resetDashboard } from '../ops-dashboard.stub';
import { formatDateTime, logRow } from './log.fixtures';

const gql = vi.hoisted(() => ({ stats: vi.fn(), refetchStats: vi.fn() }));
const hook = vi.hoisted(() => ({
  onChanged: null as null | (() => void),
  actions: {
    copying: false,
    copyFixPrompt: vi.fn(),
    copyOpenErrors: vi.fn(),
    changeStatus: vi.fn(),
    remove: vi.fn(),
  },
}));
const dialog = vi.hoisted(() => ({
  props: null as null | { row: { id: string } | null; actions: unknown; onClose: () => void },
}));

vi.mock('@exyconn/crud', async () => (await import('../ops-dashboard.stub')).crudModule());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListAppLogGroupsStatsQuery: gql.stats,
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('./log.fixtures')).settingsModule(),
);
vi.mock('../../../../src/pages/logs/useLogActions', () => ({
  useLogActions: (onChanged: () => void) => {
    hook.onChanged = onChanged;
    return hook.actions;
  },
}));
vi.mock('../../../../src/pages/logs/LogDetailDialog', () => ({
  LogDetailDialog: (props: NonNullable<typeof dialog.props>) => {
    dialog.props = props;
    return <p>viewing {props.row?.id ?? 'none'}</p>;
  },
}));

const STATS = {
  total: 14,
  counts: [
    { field: 'status', buckets: [{ value: 'OPEN', count: 5 }] },
    {
      field: 'level',
      buckets: [
        { value: 'ERROR', count: 4 },
        { value: 'WARN', count: 2 },
      ],
    },
    { field: 'source', buckets: [{ value: 'MOBILE', count: 3 }] },
  ],
  sums: [{ field: 'count', total: 99 }],
};

const signal = () => screen.getByLabelText('refresh signal').textContent;
const stats = () =>
  within(screen.getByRole('list', { name: 'stats' }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);

describe('LogsPage', () => {
  beforeEach(() => {
    resetDashboard();
    hook.onChanged = null;
    dialog.props = null;
    for (const spy of Object.values(hook.actions)) {
      if (typeof spy === 'function') {
        spy.mockReset();
      }
    }
    gql.refetchStats.mockReset().mockResolvedValue({});
    gql.stats.mockReset().mockReturnValue({
      data: { listAppLogGroupsStats: STATS },
      loading: false,
      refetch: gql.refetchStats,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tiles open problems, errors, warnings, occurrences and each source', () => {
    renderWithProviders(<LogsPage />);

    expect(stats()).toEqual([
      'Open: 5',
      'Errors: 4',
      'Warnings: 2',
      'Occurrences: 99',
      'Desktop: 0',
      'Mobile: 3',
      'Portal: 0',
      'Server: 0',
    ]);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('holds the tiles as loading until the stats first answer', () => {
    gql.stats.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetchStats });
    renderWithProviders(<LogsPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(stats()[0]).toBe('Open: 0');
  });

  it('pages the grouped logs, scoped to open problems by default', () => {
    renderWithProviders(<LogsPage />);

    expect(paged.document).toBe(ListAppLogGroupsPagedDocument);
    expect(paged.extraFilters).toEqual([{ field: 'status', op: FilterOp.Equals, value: 'OPEN' }]);
    const page = { totalCount: 0, rows: [] };
    expect(paged.select?.({ listAppLogGroupsPaged: page } as never)).toBe(page);
    expect(signal()).toBe('1');
  });

  it('re-reads the grid when a toolbar filter changes', async () => {
    renderWithProviders(<LogsPage />);
    await userEvent.click(screen.getByRole('combobox', { name: /^Source/ }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'Mobile' }),
    );

    await waitFor(() => expect(signal()).toBe('2'));
    expect(paged.extraFilters).toEqual([
      { field: 'source', op: FilterOp.Equals, value: 'MOBILE' },
      { field: 'status', op: FilterOp.Equals, value: 'OPEN' },
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'Copy open errors for Claude' }));
    expect(hook.actions.copyOpenErrors).toHaveBeenCalledWith('MOBILE');
  });

  it('copies open errors from every source when none is picked', async () => {
    renderWithProviders(<LogsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy open errors for Claude' }));

    expect(hook.actions.copyOpenErrors).toHaveBeenCalledWith(null);
  });

  it('re-reads the grid and the tiles after an action changes a log', () => {
    renderWithProviders(<LogsPage />);
    act(() => hook.onChanged?.());

    expect(signal()).toBe('2');
    expect(gql.refetchStats).toHaveBeenCalledTimes(1);
  });

  it('logs a failed tile refresh instead of dropping it', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('stats down');
    gql.refetchStats.mockRejectedValue(failure);
    renderWithProviders(<LogsPage />);
    act(() => hook.onChanged?.());

    await waitFor(() => expect(logged).toHaveBeenCalledWith('Log stats refresh failed', failure));
  });

  it('wires the row actions to the log actions and the viewer’s date format', () => {
    renderWithProviders(<LogsPage />);
    const { actions, formatDate } = dashboardProps().context;
    const row = logRow();

    expect(actions.claude).toBe(hook.actions.copyFixPrompt);
    expect(actions.delete).toBe(hook.actions.remove);
    expect(formatDate).toBe(formatDateTime);
    actions.resolve(row as never);
    expect(hook.actions.changeStatus).toHaveBeenCalledWith(row, AppLogStatus.Resolved);
  });

  it('opens a problem from its view action or its row, and closes it', () => {
    renderWithProviders(<LogsPage />);
    expect(screen.getByText('viewing none')).toBeInTheDocument();
    expect(dialog.props?.actions).toBe(hook.actions);

    act(() => {
      dashboardProps().context.actions.view(logRow({ id: 'grp-7' }) as never);
    });
    expect(screen.getByText('viewing grp-7')).toBeInTheDocument();

    act(() => dialog.props?.onClose());
    expect(screen.getByText('viewing none')).toBeInTheDocument();

    act(() => dashboardProps().onRowClick?.(logRow({ id: 'grp-9' }) as never));
    expect(screen.getByText('viewing grp-9')).toBeInTheDocument();
  });
});
