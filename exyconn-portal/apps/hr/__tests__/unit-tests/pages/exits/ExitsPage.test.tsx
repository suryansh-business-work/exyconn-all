import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExitStage, ListExitRecordsPagedDocument } from '@exyconn/shell/graphql/generated';
import { ExitsPage } from '../../../../src/pages/exits';
import { EXIT_RECORD_COLUMNS } from '../../../../src/pages/exits/exit-record-grid';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps } from '../../harness/crud-dashboard';
import { runRowAction, tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  remove: vi.fn(),
  refetch: vi.fn(),
  heldAssets: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListExitRecordsStatsQuery: () => gql.stats(),
  useDeleteExitRecordMutation: () => [gql.remove],
  useExitRecordHeldAssetsQuery: (options: unknown) => gql.heldAssets(options),
  useListUsersQuery: () => ({
    data: { listUsers: [{ id: 'user-1', name: 'Asha Rao', email: 'asha@example.com' }] },
  }),
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/exits/forms/exit-record', async () => ({
  ExitRecordForm: (await import('../../harness/form-stub')).FormStub,
}));

/** The register is still being read unless a test says otherwise. */
beforeEach(() => {
  gql.heldAssets.mockReset().mockReturnValue({ data: undefined, loading: true });
});

const row = {
  id: 'exit-6',
  employeeId: 'user-1',
  stage: ExitStage.NoticePeriod,
  assetsReturned: false,
};

describeCrudPage('ExitsPage', {
  page: <ExitsPage />,
  mocks: gql,
  statsKey: 'listExitRecordsStats',
  stats: tableStats(8, { stage: { NOTICE_PERIOD: 3, CLEARANCE: 2, EXITED: 3 } }),
  lines: ['Exits: 8', 'Notice period: 3', 'Clearance: 2', 'Exited: 3'],
  emptyLines: ['Exits: 0', 'Notice period: 0', 'Clearance: 0', 'Exited: 0'],
  document: ListExitRecordsPagedDocument,
  pageKey: 'listExitRecordsPaged',
  columns: EXIT_RECORD_COLUMNS,
  meta: {
    title: 'Exits & Offboarding',
    exportFileName: 'exits',
    entityLabel: 'exit record',
    searchPlaceholder: 'Search exits…',
  },
  row,
  confirm: 'Delete this exit record?',
  entity: 'ExitRecord',
});

describe('ExitsPage held assets', () => {
  it('checks the asset register for the leaver being edited, not for a new exit', async () => {
    gql.stats.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    renderWithProviders(<ExitsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.queryByText('Checking the asset register…')).not.toBeInTheDocument();
    expect(gql.heldAssets).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', row);
    expect(screen.getByText('Checking the asset register…')).toBeInTheDocument();
    expect(gql.heldAssets).toHaveBeenCalledWith({
      variables: { id: 'exit-6' },
      fetchPolicy: 'cache-and-network',
    });
    expect(dashboardProps().context.nameOf?.('user-1')).toBe('Asha Rao');
  });
});
