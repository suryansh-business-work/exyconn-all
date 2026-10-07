import { describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AUDIT_COLUMNS } from '@exyconn/crud';
import {
  AuditAction,
  ListAuditLogsPagedDocument,
  ListAuditLogsStatsDocument,
  type ListAuditLogsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps, statValues, TABLE_INPUT, tableStats } from '../../crud-dashboard.stub';
import { AuditLogPage } from '../../../../src/pages/audit';

vi.mock('@exyconn/crud', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/crud')>();
  const { CrudDashboardStub } = await import('../../crud-dashboard.stub');
  return { ...actual, CrudDashboard: CrudDashboardStub };
});

type AuditRow = ListAuditLogsPagedQuery['listAuditLogsPaged']['rows'][number];

const entry = (overrides: Partial<AuditRow> = {}): AuditRow => ({
  __typename: 'AuditLog',
  id: 'log-1',
  actorId: 'user-1',
  actorName: 'Asha Rao',
  actorEmail: 'asha@example.com',
  action: AuditAction.Update,
  module: 'Client',
  entityId: 'client-7',
  entityLabel: 'Acme',
  summary: 'Updated client Acme',
  changes: JSON.stringify({ phone: { from: '111', to: '222' } }),
  ip: '198.51.100.4',
  createdAt: '2026-10-01T09:30:00.000Z',
  ...overrides,
});

const stats = {
  request: { query: ListAuditLogsStatsDocument },
  result: {
    data: {
      listAuditLogsStats: tableStats(40, {
        action: { [AuditAction.Update]: 12, [AuditAction.Delete]: 3, [AuditAction.Login]: 20 },
      }),
    },
  },
};

const page = (rows: AuditRow[]) => ({
  request: { query: ListAuditLogsPagedDocument, variables: () => true },
  result: {
    data: { listAuditLogsPaged: { __typename: 'AuditLogPage', totalCount: rows.length, rows } },
  },
});

describe('AuditLogPage', () => {
  it('hands the dashboard the read-only audit grid with the date formatter on its context', () => {
    renderWithProviders(<AuditLogPage />, { mocks: [stats] });
    const props = dashboardProps();
    expect(props.title).toBe('Audit Log');
    expect(props.entityLabel).toBe('entry');
    expect(props.exportFileName).toBe('audit-log');
    expect(props.permissionModule).toBe('AuditLog');
    expect(props.columnDefs).toBe(AUDIT_COLUMNS);
    expect(props.crud).toBeUndefined();
    expect(typeof props.context.formatDateTime).toBe('function');
  });

  it('counts entries, updates, deletes and sign-ins once the stats answer', async () => {
    renderWithProviders(<AuditLogPage />, { mocks: [stats] });
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues()).toEqual({ Entries: '0', Updates: '0', Deletes: '0', 'Sign-ins': '0' });

    await waitFor(() =>
      expect(statValues()).toEqual({
        Entries: '40',
        Updates: '12',
        Deletes: '3',
        'Sign-ins': '20',
      }),
    );
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('reads a page of entries from the server for the grid', async () => {
    renderWithProviders(<AuditLogPage />, { mocks: [stats, page([entry()])] });
    await expect(dashboardProps().fetchRows(TABLE_INPUT)).resolves.toEqual({
      rows: [entry()],
      totalCount: 1,
    });
  });

  it('opens the full entry from a row click, with what changed, and closes it again', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuditLogPage />, { mocks: [stats] });
    expect(screen.queryByText('Audit details')).toBeNull();

    act(() => dashboardProps().onRowClick?.(entry()));
    const heading = await screen.findByText('Audit details');
    const drawer = within(heading.closest('.MuiDrawer-root') as HTMLElement);
    expect(drawer.getByText('Updated client Acme')).toBeInTheDocument();
    expect(drawer.getByText('Asha Rao (asha@example.com)')).toBeInTheDocument();
    expect(drawer.getByText('Acme · client-7')).toBeInTheDocument();
    expect(drawer.getByRole('table', { name: 'changed fields' })).toHaveTextContent('phone111222');

    await user.click(drawer.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Audit details')).toBeNull());
  });

  it('opens the same entry from the details row action', async () => {
    renderWithProviders(<AuditLogPage />, { mocks: [stats] });
    act(() => {
      dashboardProps().context.actions.details(entry({ summary: 'Signed in', changes: '' }));
    });
    expect(await screen.findByText('Signed in')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'changed fields' })).toBeNull();
  });
});
