import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { color } from '@exyconn/shell/components/ui';
import { TrackerOverviewPage } from '../../../../src/pages/overview';
import { moneyFormat } from '../../../../src/pages/tracker/tracker.billing';
import { renderWithProviders } from '../../test-utils';
import { overviewProps, tableProps, captured, type TableRow } from './overview.stubs';
import { ROWS, billingRow } from './overview.fixtures';

const gql = vi.hoisted(() => ({
  access: vi.fn(),
  devices: vi.fn(),
  pending: vi.fn(),
  billing: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerAccessListQuery: () => gql.access(),
  useTrackerDevicesQuery: () => gql.devices(),
  useTrackerPendingManualEntriesQuery: () => gql.pending(),
  useTrackerBillingQuery: (options: unknown) => gql.billing(options),
}));

vi.mock('@exyconn/shell/components/dashboard/ModuleOverview', async () => ({
  ModuleOverview: (await import('./overview.stubs')).ModuleOverviewStub,
}));

vi.mock('@exyconn/shell/components/data/DataTable', async () => ({
  DataTable: (await import('./overview.stubs')).DataTableStub,
}));

const answer = (data: unknown, loading = false) => ({ data, loading, refetch: gql.refetch });

describe('TrackerOverviewPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 15, 10, 30));
    captured.overview = null;
    captured.table = null;
    gql.access.mockReset().mockReturnValue(
      answer({
        trackerAccessList: [{ isActive: true }, { isActive: false }, { isActive: true }],
      }),
    );
    gql.devices.mockReset().mockReturnValue(
      answer({
        trackerDevices: [
          { platform: 'darwin', isActive: true },
          { platform: 'win32', isActive: true },
          { platform: 'darwin', isActive: true },
          { platform: 'linux', isActive: false },
        ],
      }),
    );
    gql.pending
      .mockReset()
      .mockReturnValue(answer({ trackerPendingManualEntries: [{ id: 'm1' }] }));
    gql.billing
      .mockReset()
      .mockReturnValue(
        answer({ trackerBilling: { totalHours: 74.96, currency: 'USD', rows: ROWS } }),
      );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks for billing over the current calendar month', () => {
    renderWithProviders(<TrackerOverviewPage />);

    expect(gql.billing).toHaveBeenCalledWith({
      variables: {
        from: new Date(2026, 9, 1).toISOString(),
        to: new Date(2026, 10, 1).toISOString(),
      },
    });
  });

  it('counts only active access rows and devices, the month hours and the pending entries', () => {
    renderWithProviders(<TrackerOverviewPage />);
    const { stats, statsLoading, title } = overviewProps();

    expect(title).toBe('Time Tracker');
    expect(statsLoading).toBe(false);
    expect(stats).toEqual([
      { label: 'Tracking', value: '2', accent: color.blue[400] },
      { label: 'Devices', value: '3', accent: color.cyan[600] },
      { label: 'Hours this month', value: '75.0', accent: color.green[500] },
      { label: 'Awaiting approval', value: '1', accent: color.amber[500] },
    ]);
  });

  it('ranks the eight busiest employees and splits active devices by platform', () => {
    renderWithProviders(<TrackerOverviewPage />);
    const [hours, platforms] = overviewProps().breakdowns ?? [];

    expect(hours.title).toBe('Hours this month, top employees');
    expect(hours.buckets).toEqual([
      { value: 'Employee e7', count: 30 },
      { value: 'Employee e1', count: 13 },
      { value: 'Employee e4', count: 9 },
      { value: 'Employee e3', count: 7 },
      { value: 'Employee e9', count: 5 },
      { value: 'Employee e6', count: 4 },
      { value: 'Employee e0', count: 3 },
      { value: 'Employee e8', count: 2 },
    ]);
    expect(platforms.buckets).toEqual([
      { value: 'darwin', count: 2 },
      { value: 'win32', count: 1 },
    ]);
    expect(tableProps().rows.map((row) => row.id)).toEqual([
      'e7',
      'e1',
      'e4',
      'e3',
      'e9',
      'e6',
      'e0',
      'e8',
    ]);
  });

  it('links on to activity, approvals, billing and access', () => {
    renderWithProviders(<TrackerOverviewPage />);

    expect(overviewProps().links?.map((link) => link.to)).toEqual([
      '/tracker/activity',
      '/tracker/approvals',
      '/tracker/billing',
      '/tracker/access',
    ]);
  });

  it('formats hours to one decimal and money in the report currency, a dash when unrated', () => {
    renderWithProviders(<TrackerOverviewPage />);
    const { columns } = tableProps();
    const money = moneyFormat('USD');
    const cell = (key: string, row: TableRow) => columns.find((c) => c.key === key)?.render?.(row);
    const rated = billingRow('r', 2.26);
    const unrated = billingRow('u', 2, false);

    expect(columns.map((c) => c.label)).toEqual([
      'Employee',
      'Email',
      'Hours',
      'Rate / hour',
      'Amount',
    ]);
    expect(cell('hours', rated)).toBe('2.3');
    expect(cell('billingRate', rated)).toBe(money.format(40));
    expect(cell('amount', rated)).toBe(money.format(rated.amount));
    expect(cell('billingRate', unrated)).toBe('—');
    expect(cell('amount', unrated)).toBe('—');
  });

  it('hands the table its loading flag, empty message and the billing refetch', () => {
    gql.billing.mockReturnValue(
      answer({ trackerBilling: { totalHours: 0, currency: 'USD', rows: [] } }, true),
    );
    renderWithProviders(<TrackerOverviewPage />);

    expect(tableProps()).toMatchObject({
      rows: [],
      loading: true,
      emptyMessage: 'No tracked time this month.',
      onRefresh: gql.refetch,
    });
    // Data already on screen: a refresh does not blank the tiles.
    expect(overviewProps().statsLoading).toBe(false);
  });

  it('shows zeros and nothing to rank before any query has answered', () => {
    for (const query of [gql.access, gql.devices, gql.pending, gql.billing]) {
      query.mockReturnValue(answer(undefined));
    }
    renderWithProviders(<TrackerOverviewPage />);

    expect(overviewProps().stats.map((stat) => stat.value)).toEqual(['0', '0', '0.0', '0']);
    expect(overviewProps().breakdowns?.map((b) => b.buckets)).toEqual([[], []]);
    expect(overviewProps().statsLoading).toBe(false);
  });

  it.each([
    ['access', gql.access],
    ['devices', gql.devices],
    ['pending entries', gql.pending],
    ['billing', gql.billing],
  ])('marks the tiles loading while the %s query has not first answered', (_name, query) => {
    query.mockReturnValue(answer(undefined, true));
    renderWithProviders(<TrackerOverviewPage />);

    expect(overviewProps().statsLoading).toBe(true);
  });
});
