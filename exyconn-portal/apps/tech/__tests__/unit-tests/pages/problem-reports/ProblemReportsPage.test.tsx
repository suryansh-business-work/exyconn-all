import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListProblemReportsPagedDocument } from '@exyconn/shell/graphql/generated';
import { ProblemReportsPage } from '../../../../src/pages/problem-reports';
import { PROBLEM_REPORT_COLUMNS } from '../../../../src/pages/problem-reports/problem-reports-grid';
import { renderWithProviders } from '../../test-utils';
import { crudResource, dashboardProps, paged, resetDashboard } from '../ops-dashboard.stub';
import { reportRow } from './report.fixtures';

const gql = vi.hoisted(() => ({ stats: vi.fn(), refetchStats: vi.fn(), remove: vi.fn() }));
const form = vi.hoisted(() => ({
  props: null as null | { initial: unknown; onCancel: () => void; onDone: () => void },
}));

vi.mock('@exyconn/crud', async () => (await import('../ops-dashboard.stub')).crudModule());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListProblemReportsStatsQuery: gql.stats,
  useDeleteProblemReportMutation: () => [gql.remove],
}));
vi.mock('../../../../src/pages/problem-reports/forms/problem-report', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ProblemReportForm: (props: NonNullable<typeof form.props>) => {
    form.props = props;
    return (
      <div>
        <button type="button" onClick={props.onCancel}>
          stub cancel
        </button>
        <button type="button" onClick={props.onDone}>
          stub done
        </button>
      </div>
    );
  },
}));

const STATS = {
  total: 9,
  counts: [
    {
      field: 'status',
      buckets: [
        { value: 'NEW', count: 4 },
        { value: 'IN_PROGRESS', count: 2 },
      ],
    },
    { field: 'severity', buckets: [{ value: 'CRITICAL', count: 1 }] },
  ],
  sums: [],
};

const stats = () =>
  within(screen.getByRole('list', { name: 'stats' }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);

const resource = () => {
  if (!crudResource.options) {
    throw new Error('useCrudResource was not called');
  }
  return crudResource.options;
};

describe('ProblemReportsPage', () => {
  beforeEach(() => {
    resetDashboard();
    form.props = null;
    gql.remove.mockReset().mockResolvedValue({ data: {} });
    gql.refetchStats.mockReset();
    gql.stats.mockReset().mockReturnValue({
      data: { listProblemReportsStats: STATS },
      loading: false,
      refetch: gql.refetchStats,
    });
  });

  it('tiles all, new, in-progress and critical reports', () => {
    renderWithProviders(<ProblemReportsPage />);

    expect(screen.getByRole('heading', { name: 'Problem Reports' })).toBeInTheDocument();
    expect(stats()).toEqual(['Reports: 9', 'New: 4', 'In progress: 2', 'Critical: 1']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('holds the tiles as loading until the stats first answer', () => {
    gql.stats.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetchStats });
    renderWithProviders(<ProblemReportsPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(stats()).toEqual(['Reports: 0', 'New: 0', 'In progress: 0', 'Critical: 0']);
  });

  it('pages the triage grid from the server', () => {
    renderWithProviders(<ProblemReportsPage />);

    expect(dashboardProps().columnDefs).toBe(PROBLEM_REPORT_COLUMNS);
    expect(dashboardProps().fetchRows).toBe(paged.fetchRows);
    expect(paged.document).toBe(ListProblemReportsPagedDocument);
    const page = { totalCount: 0, rows: [] };
    expect(paged.select?.({ listProblemReportsPaged: page } as never)).toBe(page);
  });

  it('deletes a report by id after naming it, then re-reads the tiles', async () => {
    renderWithProviders(<ProblemReportsPage />);
    const options = resource();
    const row = reportRow() as never;

    expect(options.label).toBe('Problem report');
    expect(options.refetch).toBe(gql.refetchStats);
    expect(options.confirmMessage(row)).toEqual({
      message: 'Delete report {reference}?',
      values: { reference: 'PR-1042' },
    });
    await options.onDelete(row);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'pr-1' } });
  });

  it('wires edit and delete on each row to the CRUD state', () => {
    renderWithProviders(<ProblemReportsPage />);

    expect(dashboardProps().context.actions.edit).toBe(crudResource.handlers.openEdit);
    expect(dashboardProps().context.actions.delete).toBe(crudResource.handlers.remove);
  });

  it('renders the triage form with the CRUD close and done handlers', async () => {
    renderWithProviders(<ProblemReportsPage />);

    expect(form.props?.initial).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'stub cancel' }));
    expect(crudResource.handlers.close).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'stub done' }));
    expect(crudResource.handlers.onDone).toHaveBeenCalledTimes(1);
  });
});
