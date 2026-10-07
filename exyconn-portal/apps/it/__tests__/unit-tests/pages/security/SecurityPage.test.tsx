import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListItVulnerabilitiesPagedDocument } from '@exyconn/shell/graphql/generated';
import { SecurityPage } from '../../../../src/pages/security';
import { VULNERABILITY_COLUMNS } from '../../../../src/pages/security/vulnerabilities-grid';
import { renderWithProviders } from '../../test-utils';
import { pending, tableStats, vulnerabilityRow } from '../page-kit/fixtures';
import { dashboardProps, paged } from '../page-kit/crud-dashboard.stub';
import { answerRowConfirm, runRowAction, statLines } from '../page-kit/page-actions';

const gql = vi.hoisted(() => ({
  vulns: vi.fn(),
  assets: vi.fn(),
  incidents: vi.fn(),
  refetch: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListItVulnerabilitiesStatsQuery: () => gql.vulns(),
  useListAssetsStatsQuery: () => gql.assets(),
  useListItIncidentsStatsQuery: () => gql.incidents(),
  useDeleteItVulnerabilityMutation: () => [gql.remove],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../page-kit/crud-dashboard.stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock(
  '@exyconn/shell/hooks/useSettings',
  async () => (await import('../page-kit/settings.mock')).settingsModule,
);

vi.mock('../../../../src/pages/security/forms/vulnerability', async () => ({
  VulnerabilityForm: (await import('../page-kit/form.stub')).FormStub,
}));

const loaded = (data: unknown) => ({ data, loading: false, refetch: gql.refetch });

describe('SecurityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.remove.mockResolvedValue({ data: { deleteItVulnerability: true } });
    const vulns = tableStats(12, {
      status: { OPEN: 4, IN_PROGRESS: 2, RESOLVED: 6 },
      severity: { CRITICAL: 1, HIGH: 5 },
    });
    const assets = tableStats(30, { edrStatus: { PROTECTED: 25, UNPROTECTED: 3, OUTDATED: 2 } });
    const incidents = tableStats(8, { category: { SECURITY: 2, NETWORK: 6 } });
    gql.vulns.mockReturnValue(loaded({ listItVulnerabilitiesStats: vulns }));
    gql.assets.mockReturnValue(loaded({ listAssetsStats: assets }));
    gql.incidents.mockReturnValue(loaded({ listItIncidentsStats: incidents }));
  });

  it('sums open work, critical findings, exposed devices and security incidents', () => {
    renderWithProviders(<SecurityPage />);

    expect(statLines()).toEqual([
      'Open vulnerabilities: 6',
      'Critical: 1',
      'Devices unprotected or outdated: 5',
      'Security incidents: 2',
    ]);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('shows zeros and a loading state while every stats query is pending', () => {
    gql.vulns.mockReturnValue(pending());
    gql.assets.mockReturnValue(pending());
    gql.incidents.mockReturnValue(pending());
    renderWithProviders(<SecurityPage />);

    expect(statLines()).toEqual([
      'Open vulnerabilities: 0',
      'Critical: 0',
      'Devices unprotected or outdated: 0',
      'Security incidents: 0',
    ]);
    expect(dashboardProps().statsLoading).toBe(true);
  });

  it('stays loading while only the device or incident counts are pending', () => {
    gql.assets.mockReturnValue(pending());
    const { unmount } = renderWithProviders(<SecurityPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    unmount();

    gql.assets.mockReturnValue(loaded({ listAssetsStats: tableStats(0) }));
    gql.incidents.mockReturnValue(pending());
    renderWithProviders(<SecurityPage />);
    expect(dashboardProps().statsLoading).toBe(true);
  });

  it('drives the server grid with the paged vulnerability query and shows the toolbar', () => {
    renderWithProviders(<SecurityPage />);
    const page = { totalCount: 1, rows: [vulnerabilityRow()] };

    expect(paged.document).toBe(ListItVulnerabilitiesPagedDocument);
    expect(paged.select?.({ listItVulnerabilitiesPaged: page } as never)).toBe(page);
    expect(dashboardProps()).toMatchObject({
      title: 'Security Center',
      exportFileName: 'vulnerabilities',
      permissionModule: 'ItVulnerability',
      columnDefs: VULNERABILITY_COLUMNS,
    });
    expect(dashboardProps().context.formatDate?.('2026-10-01')).toBe('date(2026-10-01)');
    expect(screen.getByText('Endpoint protection')).toBeInTheDocument();
  });

  it('opens the form blank or with the row, and reloads the stats after a save', async () => {
    renderWithProviders(<SecurityPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', vulnerabilityRow({ title: 'Log4Shell' }));
    expect(screen.getByText(/"title":"Log4Shell"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(screen.queryByText(/Log4Shell/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a vulnerability by id once confirmed', async () => {
    renderWithProviders(<SecurityPage />);

    await answerRowConfirm(
      'delete',
      vulnerabilityRow({ id: 'vuln-3' }),
      'Delete "XZ backdoor"?',
      'Delete',
    );

    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'vuln-3' } });
    expect(await screen.findByText('Vulnerability deleted')).toBeInTheDocument();
  });
});
