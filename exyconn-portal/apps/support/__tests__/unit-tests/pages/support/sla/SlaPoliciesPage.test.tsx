import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListSupportSlaPoliciesPagedDocument } from '@exyconn/shell/graphql/generated';
import { SlaPoliciesPage, SLA_POLICY_COLUMNS } from '../../../../../src/pages/support/sla';
import { SlaPolicyForm } from '../../../../../src/pages/support/sla/forms/sla-policy';
import { renderWithProviders } from '../../../test-utils';
import {
  crud,
  dashboardProps,
  fetcherCall,
  fetchRows,
  resetCrudPage,
  resourceOptions,
  statValues,
} from '../../../crud-page.mocks';
import { slaPolicyRow, tableStats } from '../../../fixtures';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  summary: vi.fn(),
  remove: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@exyconn/crud', async () => (await import('../../../crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListSupportSlaPoliciesStatsQuery: gql.stats,
  useSupportSlaSummaryQuery: gql.summary,
  useDeleteSupportSlaPolicyMutation: () => [gql.remove],
}));

const ROW = slaPolicyRow();

const answerStats = (data: object | undefined, loading = false) =>
  gql.stats.mockReturnValue({ data, loading, refetch: gql.refetch });

describe('SlaPoliciesPage', () => {
  beforeEach(() => {
    resetCrudPage();
    gql.remove.mockReset().mockResolvedValue({ data: { deleteSupportSlaPolicy: true } });
    gql.refetch.mockReset().mockResolvedValue({ data: {} });
    gql.summary.mockReset().mockReturnValue({ data: undefined });
    answerStats(undefined, true);
  });

  it('frames the policy register and reads the queue’s SLA summary fresh', () => {
    renderWithProviders(<SlaPoliciesPage />);
    expect(dashboardProps()).toMatchObject({
      title: 'SLA Policies',
      subtitle: 'What support promises for each priority',
      entityLabel: 'policy',
      exportFileName: 'sla-policies',
      searchPlaceholder: 'Search policies…',
      crud,
      fetchRows,
    });
    expect(dashboardProps().columnDefs).toBe(SLA_POLICY_COLUMNS);
    expect(gql.summary).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
  });

  it('shows placeholders until the stats and the summary first answer', () => {
    renderWithProviders(<SlaPoliciesPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues()).toEqual({
      Policies: '0',
      'On track': '0',
      'Due soon': '0',
      Breached: '0',
    });
  });

  it('counts the policies and where the open queue stands against them', () => {
    answerStats({ listSupportSlaPoliciesStats: tableStats(3) });
    gql.summary.mockReturnValue({
      data: { supportSlaSummary: { onTrack: 14, dueSoon: 4, breached: 2 } },
    });
    renderWithProviders(<SlaPoliciesPage />);
    expect(statValues()).toEqual({
      Policies: '3',
      'On track': '14',
      'Due soon': '4',
      Breached: '2',
    });
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('warns that tickets lose their deadline before deleting a policy by id', async () => {
    renderWithProviders(<SlaPoliciesPage />);
    const options = resourceOptions();
    expect(options.label).toBe('SLA policy');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage(ROW)).toEqual({
      message:
        'Delete the {priority} policy? Tickets raised at that priority will carry no deadline.',
      values: { priority: 'HIGH' },
    });
    await options.onDelete(ROW);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'policy-1' } });
  });

  it('reads its grid rows from the paged policies query', () => {
    renderWithProviders(<SlaPoliciesPage />);
    const paged = { rows: [ROW], totalCount: 1 };
    expect(fetcherCall().document).toBe(ListSupportSlaPoliciesPagedDocument);
    expect(fetcherCall().select({ listSupportSlaPoliciesPaged: paged })).toBe(paged);
  });

  it('opens the policy form on a record, wired to close and to reload when done', () => {
    renderWithProviders(<SlaPoliciesPage />);
    const form = dashboardProps().renderForm?.(ROW);
    expect(form?.type).toBe(SlaPolicyForm);
    expect(form?.props).toEqual({ initial: ROW, onCancel: crud.close, onDone: crud.onDone });
  });

  it('hands the grid edit and delete to the resource', () => {
    renderWithProviders(<SlaPoliciesPage />);
    const { actions } = dashboardProps().context;
    expect(actions.edit).toBe(crud.openEdit);
    expect(actions.delete).toBe(crud.remove);
  });
});
