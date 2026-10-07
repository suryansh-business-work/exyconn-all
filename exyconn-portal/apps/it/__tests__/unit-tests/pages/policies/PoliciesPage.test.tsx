import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListItPoliciesPagedDocument, PolicyStatus } from '@exyconn/shell/graphql/generated';
import { PoliciesPage } from '../../../../src/pages/policies';
import { renderWithProviders } from '../../test-utils';
import { pending, policyRow, tableStats } from '../page-kit/fixtures';
import { dashboardProps, paged } from '../page-kit/crud-dashboard.stub';
import { answerRowConfirm, statLines } from '../page-kit/page-actions';
import { actionSpecs, columnIds, formatCell, isActionHidden } from '../page-kit/grid';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  refetch: vi.fn(),
  remove: vi.fn(),
  publish: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListPoliciesStatsQuery: () => gql.stats(),
  useDeletePolicyMutation: () => [gql.remove],
  usePublishPolicyMutation: () => [gql.publish],
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

// The shared form has its own tests; publishing is the real hook, with its mutation mocked above.
vi.mock('@exyconn/shell/pages/content-forms', async () => ({
  PolicyForm: (await import('../page-kit/form.stub')).FormStub,
  usePublishPolicy: (await import('@exyconn/shell/pages/content-forms/policy/usePublishPolicy'))
    .usePublishPolicy,
}));

const columns = () => dashboardProps().columnDefs;

describe('PoliciesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.remove.mockResolvedValue({ data: { deletePolicy: true } });
    gql.publish.mockResolvedValue({ data: { publishPolicy: { id: 'policy-1' } } });
    gql.stats.mockReturnValue({
      data: { listPoliciesStats: tableStats(9, { category: { IT: 4, SECURITY: 2, HR: 3 } }) },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts only the IT and security policies', () => {
    renderWithProviders(<PoliciesPage />);

    expect(statLines()).toEqual(['IT policies: 4', 'Security policies: 2']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('shows zeros while the stats load', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<PoliciesPage />);

    expect(statLines()).toEqual(['IT policies: 0', 'Security policies: 0']);
    expect(dashboardProps().statsLoading).toBe(true);
  });

  it('drives the server grid with the IT slice of the policy register', () => {
    renderWithProviders(<PoliciesPage />);
    const page = { totalCount: 1, rows: [policyRow()] };

    expect(paged.document).toBe(ListItPoliciesPagedDocument);
    expect(paged.select?.({ listItPoliciesPaged: page } as never)).toBe(page);
    expect(dashboardProps()).toMatchObject({
      title: 'Policies',
      exportFileName: 'it-policies',
      permissionModule: 'Policy',
    });
    expect(dashboardProps().context.formatDate?.('2026-10-01')).toBe('date(2026-10-01)');
  });

  it('lists the policy columns with the version written as v-number', () => {
    renderWithProviders(<PoliciesPage />);

    expect(columnIds(columns())).toEqual([
      'title',
      'category',
      'status',
      'version',
      'effectiveDate',
      'nextReviewOn',
      'actions',
    ]);
    expect(formatCell(columns(), 'version', policyRow({ version: 3 }))).toBe('v3');
  });

  it('offers publish, edit and delete, but never publish for an archived policy', () => {
    renderWithProviders(<PoliciesPage />);

    expect(actionSpecs(columns()).map((spec) => spec.key)).toEqual(['publish', 'edit', 'delete']);
    expect(isActionHidden(columns(), 'publish', policyRow({ status: PolicyStatus.Archived }))).toBe(
      true,
    );
    expect(isActionHidden(columns(), 'publish', policyRow({ status: PolicyStatus.Draft }))).toBe(
      false,
    );
  });

  it('opens the shared policy form limited to IT and security categories', async () => {
    renderWithProviders(<PoliciesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));

    expect(screen.getByText('Blank form')).toBeInTheDocument();
    expect(screen.getByText('Categories: IT, SECURITY')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('publishes a draft and reloads the register', async () => {
    renderWithProviders(<PoliciesPage />);

    await answerRowConfirm(
      'publish',
      policyRow(),
      'Publish "BYOD policy"? Staff will be able to read it straight away.',
      'Publish',
    );

    expect(gql.publish).toHaveBeenCalledWith({
      variables: { id: 'policy-1', raiseVersion: false },
    });
    expect(gql.refetch).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('Policy published')).toBeInTheDocument();
  });

  it('republishes a published policy as its next version', async () => {
    renderWithProviders(<PoliciesPage />);

    await answerRowConfirm(
      'publish',
      policyRow({ status: PolicyStatus.Published, version: 2 }),
      'Has the wording of "BYOD policy" changed? Choosing yes makes it v3 and asks everybody to sign again.',
      'Yes, new version',
    );

    expect(gql.publish).toHaveBeenCalledWith({ variables: { id: 'policy-1', raiseVersion: true } });
    expect(await screen.findByText('Published as a new version')).toBeInTheDocument();
  });

  it('deletes a policy and its signatures once confirmed', async () => {
    renderWithProviders(<PoliciesPage />);

    await answerRowConfirm(
      'delete',
      policyRow({ id: 'policy-7' }),
      'Delete "BYOD policy"? Signatures against it are deleted too.',
      'Delete',
    );

    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'policy-7' } });
    expect(await screen.findByText('Policy deleted')).toBeInTheDocument();
  });
});
