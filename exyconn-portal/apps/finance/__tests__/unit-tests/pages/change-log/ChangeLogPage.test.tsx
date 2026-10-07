import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AUDIT_COLUMNS } from '@exyconn/crud';
import {
  AuditAction,
  ListFinanceChangeLogPagedDocument,
  type AuditLogRowFragment,
} from '@exyconn/shell/graphql/generated';
import { ChangeLogPage } from '../../../../src/pages/change-log';
import { renderWithProviders } from '../../test-utils';
import { pending, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { runRowAction, statLines } from '../../crud-page-helpers';

interface DrawerProps {
  row: AuditLogRowFragment | null;
  title: string;
  onClose: () => void;
  formatDateTime: (value: string) => string;
}

const gql = vi.hoisted(() => ({ stats: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListFinanceChangeLogStatsQuery: () => gql.stats(),
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

/** The drawer has its own tests in the shell; the stand-in shows which entry it holds. */
vi.mock('@exyconn/shell/components/audit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/audit')>()),
  AuditDetailsDrawer: ({ row, title, onClose, formatDateTime }: Readonly<DrawerProps>) =>
    row ? (
      <section aria-label={title}>
        <p>{`${row.summary} at ${formatDateTime(row.createdAt)}`}</p>
        <button type="button" onClick={onClose}>
          Close details
        </button>
      </section>
    ) : null,
}));

function entry(overrides: Partial<AuditLogRowFragment> = {}): AuditLogRowFragment {
  return {
    id: 'audit-1',
    actorId: 'user-1',
    actorName: 'Asha Rao',
    actorEmail: 'asha@example.com',
    action: AuditAction.Update,
    module: 'Invoice',
    entityId: 'invoice-1',
    entityLabel: 'INV-001',
    summary: 'Changed the due date',
    changes: '[]',
    ip: '',
    createdAt: '2026-09-04T10:30:00.000Z',
    ...overrides,
  };
}

describe('ChangeLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.stats.mockReturnValue({
      data: {
        listFinanceChangeLogStats: tableStats(12, { action: { CREATE: 5, UPDATE: 6, DELETE: 1 } }),
      },
      loading: false,
    });
  });

  it('counts the entries by what kind of change they record', () => {
    renderWithProviders(<ChangeLogPage />);

    expect(statLines()).toEqual(['Entries: 12', 'Created: 5', 'Updated: 6', 'Deleted: 1']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<ChangeLogPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()[0]).toBe('Entries: 0');
  });

  it('is a read-only server grid over the finance change log', () => {
    renderWithProviders(<ChangeLogPage />);
    const page = { totalCount: 1, rows: [entry()] };

    expect(paged.document).toBe(ListFinanceChangeLogPagedDocument);
    expect(paged.select?.({ listFinanceChangeLogPaged: page } as never)).toBe(page);
    expect(dashboardProps()).toMatchObject({
      title: 'Change log',
      exportFileName: 'finance-change-log',
      permissionModule: 'FinanceChangeLog',
      columnDefs: AUDIT_COLUMNS,
    });
    expect(dashboardProps().crud).toBeUndefined();
    expect(screen.queryByRole('button', { name: 'Open new form' })).not.toBeInTheDocument();
  });

  it('opens an entry’s details from its details action and closes them again', async () => {
    renderWithProviders(<ChangeLogPage />);

    await runRowAction('details', entry({ summary: 'Raised the amount' }));
    const drawer = screen.getByRole('region', { name: 'Change details' });
    expect(drawer).toHaveTextContent(/^Raised the amount at /);

    await userEvent.click(screen.getByRole('button', { name: 'Close details' }));
    expect(screen.queryByRole('region', { name: 'Change details' })).not.toBeInTheDocument();
  });

  it('opens an entry’s details from a click on its row', () => {
    renderWithProviders(<ChangeLogPage />);

    act(() => {
      dashboardProps().onRowClick?.(entry({ summary: 'Deleted a bill' }) as never);
    });

    expect(screen.getByText(/^Deleted a bill at /)).toBeInTheDocument();
    expect(dashboardProps().context.formatDateTime).toEqual(expect.any(Function));
  });
});
