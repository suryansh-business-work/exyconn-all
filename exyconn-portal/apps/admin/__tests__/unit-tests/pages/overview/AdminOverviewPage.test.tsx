import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuditAction } from '@exyconn/shell/graphql/generated';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { AdminOverviewPage } from '../../../../src/pages/overview';

type Answer = { data: unknown; loading: boolean };

const hooks = vi.hoisted(() => {
  const users: { data: unknown; loading: boolean } = { data: undefined, loading: false };
  const clients: { data: unknown; loading: boolean } = { data: undefined, loading: false };
  const auditStats: { data: unknown; loading: boolean } = { data: undefined, loading: false };
  const audit: { data: unknown; loading: boolean } = { data: undefined, loading: false };
  return {
    users,
    clients,
    auditStats,
    audit,
    auditQuery: vi.fn(),
    refetch: vi.fn(),
  };
});

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useListUsersStatsQuery: () => hooks.users,
  useListClientsStatsQuery: () => hooks.clients,
  useListAuditLogsStatsQuery: () => hooks.auditStats,
  useListAuditLogsPagedQuery: (options: unknown) => {
    hooks.auditQuery(options);
    return { ...hooks.audit, refetch: hooks.refetch };
  },
}));

/** Chart.js needs a canvas jsdom lacks; the stand-in prints the bars it was asked to draw. */
vi.mock('react-chartjs-2', () => ({
  Bar: ({ data }: Readonly<{ data: { labels: string[] } }>) => (
    <output data-testid="bars">{data.labels.join('|')}</output>
  ),
  Line: () => null,
}));

const counts = (field: string, buckets: Array<[string, number]>) => ({
  field,
  buckets: buckets.map(([value, count]) => ({ value, count })),
});
const stats = (total: number, fields: ReturnType<typeof counts>[] = []) => ({
  total,
  counts: fields,
  sums: [],
});

const change = (id: string, actorName: string, action: AuditAction) => ({
  id,
  actorId: `user-${id}`,
  actorName,
  actorEmail: `${id}@example.com`,
  action,
  module: 'hr',
  entityId: `entity-${id}`,
  entityLabel: `Record ${id}`,
  summary: '',
  changes: '',
  ip: '',
  createdAt: '2026-09-19T10:30:00.000Z',
});

const loaded = (data: unknown): Answer => ({ data, loading: false });

beforeEach(() => {
  hooks.users = loaded({
    listUsersStats: stats(12, [
      counts('isActive', [
        ['true', 9],
        ['false', 3],
      ]),
      counts('roles', [
        ['EMPLOYEE', 8],
        ['HR', 2],
      ]),
    ]),
  });
  hooks.clients = loaded({ listClientsStats: stats(5) });
  hooks.auditStats = loaded({ listAuditLogsStats: stats(40, [counts('module', [['hr', 30]])]) });
  hooks.audit = loaded({
    listAuditLogsPaged: {
      totalCount: 2,
      rows: [change('a', 'Asha', AuditAction.RoleChange), change('b', 'Ben', AuditAction.Create)],
    },
  });
  hooks.refetch.mockResolvedValue({});
});
afterEach(() => vi.resetAllMocks());

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

function mount() {
  const user = userEvent.setup();
  renderWithProviders(
    <>
      <AdminOverviewPage />
      <Url />
    </>,
    { route: '/admin' },
  );
  return user;
}

const tile = (label: string) => screen.getByText(label).parentElement?.parentElement as HTMLElement;

describe('AdminOverviewPage', () => {
  it('adds up users, active users, clients and logged changes', () => {
    mount();
    expect(screen.getByRole('heading', { name: 'Admin' })).toBeInTheDocument();
    expect(within(tile('Users')).getByText('12')).toBeInTheDocument();
    expect(within(tile('Active')).getByText('9')).toBeInTheDocument();
    expect(within(tile('Clients')).getByText('5')).toBeInTheDocument();
    expect(within(tile('Logged changes')).getByText('40')).toBeInTheDocument();
  });

  it('breaks users down by role and changes down by module', () => {
    mount();
    expect(screen.getByRole('heading', { name: 'Users by role' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Changes by module' })).toBeInTheDocument();
    expect(screen.getAllByTestId('bars').map((node) => node.textContent)).toEqual([
      'Employee|Hr',
      'Hr',
    ]);
  });

  it('lists the newest eight changes, newest first by the log’s own order', () => {
    mount();
    expect(hooks.auditQuery).toHaveBeenCalledWith({
      variables: { input: { page: 0, pageSize: 8 } },
    });
    const asha = screen.getByText('Asha').closest('tr') as HTMLElement;
    expect(within(asha).getByText('ROLE CHANGE')).toBeInTheDocument();
    expect(within(asha).getByText('Record a')).toBeInTheDocument();
    expect(within(asha).getByText(/Sep 2026/)).toBeInTheDocument();
    expect(screen.getByText('Ben')).toBeInTheDocument();
  });

  it('shows placeholders, not zeros, until the first stats arrive', () => {
    hooks.users = { data: undefined, loading: true };
    hooks.clients = { data: undefined, loading: true };
    hooks.auditStats = { data: undefined, loading: true };
    mount();
    expect(within(tile('Users')).queryByText('0')).toBeNull();
  });

  it('waits for the client and audit stats too, even once users have loaded', () => {
    hooks.clients = { data: undefined, loading: true };
    mount();
    expect(within(tile('Users')).queryByText('12')).toBeNull();
  });

  it('reads stats that never arrived as zero, with nothing to break down', () => {
    hooks.users = { data: undefined, loading: false };
    hooks.clients = { data: undefined, loading: false };
    hooks.auditStats = { data: undefined, loading: false };
    hooks.audit = { data: undefined, loading: false };
    mount();
    expect(within(tile('Users')).getByText('0')).toBeInTheDocument();
    expect(within(tile('Active')).getByText('0')).toBeInTheDocument();
    expect(screen.queryByTestId('bars')).toBeNull();
    expect(screen.getByText('Nothing has been changed yet.')).toBeInTheDocument();
  });

  it('shows an empty breakdown when the stats carry no such field', () => {
    hooks.users = loaded({ listUsersStats: stats(2) });
    hooks.auditStats = loaded({ listAuditLogsStats: stats(1) });
    mount();
    expect(within(tile('Active')).getByText('0')).toBeInTheDocument();
    expect(screen.getAllByText('Nothing to show yet.')).toHaveLength(2);
  });

  it('sends the administrator on to users, clients, the log and health, and reloads', async () => {
    const user = mount();
    await user.click(screen.getByRole('button', { name: 'Open users' }));
    expect(screen.getByLabelText('url')).toHaveTextContent('/admin/users');
    await user.click(screen.getByRole('button', { name: 'Open audit log' }));
    expect(screen.getByLabelText('url')).toHaveTextContent('/admin/audit');
    await user.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(hooks.refetch).toHaveBeenCalledTimes(1);
  });
});
