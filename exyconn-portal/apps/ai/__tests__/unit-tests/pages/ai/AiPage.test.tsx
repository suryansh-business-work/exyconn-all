import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListAiJobsPagedDocument } from '@exyconn/shell/graphql/generated';
import { AiPage } from '../../../../src/pages/ai/AiPage';
import { AI_JOB_COLUMNS } from '../../../../src/pages/ai/ai-jobs-grid';
import { AiJobForm } from '../../../../src/pages/ai/forms/ai-job';
import { renderWithProviders } from '../../test-utils';
import { crud, crudOptions, dashboardProps, paged, rowAction } from './crud-stub';
import { pagedJob, tableStats } from './ai-fixtures';

const gql = vi.hoisted(() => ({
  stats: { loading: false } as { data?: unknown; loading: boolean },
  refetchStats: vi.fn(),
  deleteAiJob: vi.fn(),
  runAiJob: vi.fn(),
  queue: { inFlight: 0, refresh: vi.fn(), onTick: null as null | (() => void) },
  formatDate: vi.fn((value: string) => `on ${value}`),
}));

vi.mock('@exyconn/crud', async (orig) => ({
  ...(await orig<typeof import('@exyconn/crud')>()),
  ...(await import('./crud-stub')).crudMocks,
}));

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useListAiJobsStatsQuery: () => ({ ...gql.stats, refetch: gql.refetchStats }),
  useDeleteAiJobMutation: () => [gql.deleteAiJob],
  useRunAiJobMutation: () => [gql.runAiJob],
}));

vi.mock('../../../../src/pages/ai/useAiJobQueue', () => ({
  useAiJobQueue: (onTick: () => void) => {
    gql.queue.onTick = onTick;
    return { inFlight: gql.queue.inFlight, refresh: gql.queue.refresh };
  },
}));

vi.mock('../../../../src/pages/ai/AiJobResult', () => ({
  AiJobResult: ({ id }: Readonly<{ id: string }>) => <p>Result of {id}</p>,
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDate: gql.formatDate }),
}));

const STATS = tableStats(7, { status: { SUCCEEDED: 5, FAILED: 2 } }, { costUsd: 1.234 });
const ROW = pagedJob();

const tiles = () => dashboardProps().stats.map((s) => [s.label, s.value]);

async function closeDrawer(title: string) {
  const heading = screen.getByRole('heading', { name: title });
  await userEvent.click(
    within(heading.parentElement as HTMLElement).getByRole('button', { name: 'Close' }),
  );
}

describe('AiPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.stats = { loading: false };
    gql.queue.inFlight = 0;
  });

  it('lays out the jobs register with tiles from the stats aggregation', () => {
    gql.stats = { data: { listAiJobsStats: STATS }, loading: false };
    renderWithProviders(<AiPage />);
    expect(dashboardProps()).toMatchObject({
      exportFileName: 'ai-jobs',
      title: 'AI',
      subtitle: 'AI jobs',
      entityLabel: 'job',
      searchPlaceholder: 'Search AI jobs…',
      statsLoading: false,
      columnDefs: AI_JOB_COLUMNS,
      fetchRows: paged.fetchRows,
      crud: crud.resource,
    });
    expect(tiles()).toEqual([
      ['Jobs', '7'],
      ['Succeeded', '5'],
      ['Failed', '2'],
      ['Spent', '$1.23'],
    ]);
  });

  it('shows placeholders, not zeros, until the stats first answer', () => {
    gql.stats = { loading: true };
    renderWithProviders(<AiPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(tiles().map(([, value]) => value)).toEqual(['0', '0', '0', '$0.00']);
  });

  it('pages the grid through the paged jobs query', () => {
    renderWithProviders(<AiPage />);
    const page = { rows: [ROW], totalCount: 1 };
    expect(paged.document).toBe(ListAiJobsPagedDocument);
    expect(paged.select?.({ listAiJobsPaged: page })).toBe(page);
  });

  it('deletes a job by id after a confirm that names it, then re-reads the stats', async () => {
    gql.deleteAiJob.mockResolvedValue({ data: { deleteAiJob: true } });
    renderWithProviders(<AiPage />);
    const options = crudOptions();
    expect(options.label).toBe('AI job');
    expect(options.refetch).toBe(gql.refetchStats);
    expect(options.confirmMessage(ROW)).toEqual({
      message: 'Delete AI job "{name}"?',
      values: { name: 'Digest' },
    });
    await options.onDelete(ROW);
    expect(gql.deleteAiJob).toHaveBeenCalledWith({ variables: { id: 'job-1' } });
  });

  it('hands edit and delete to the resource and dates rows in the viewer format', () => {
    renderWithProviders(<AiPage />);
    expect(rowAction('edit')).toBe(crud.resource.openEdit);
    expect(rowAction('delete')).toBe(crud.resource.remove);
    expect(dashboardProps().context.formatDate).toBe(gql.formatDate);
  });

  it('renders the job form for the row being edited', () => {
    renderWithProviders(<AiPage />);
    const form = dashboardProps().renderForm(ROW) as ReactElement<object>;
    expect(form.type).toBe(AiJobForm);
    expect(form.props).toEqual({
      initial: ROW,
      onCancel: crud.resource.close,
      onDone: crud.resource.onDone,
    });
  });

  it('opens a run result for a row and closes it again', async () => {
    renderWithProviders(<AiPage />);
    expect(screen.queryByText('Result of job-1')).not.toBeInTheDocument();
    act(() => {
      rowAction('view')(ROW);
    });
    expect(await screen.findByText('Result of job-1')).toBeInTheDocument();
    await closeDrawer('Run result');
    await waitFor(() => expect(screen.queryByText('Result of job-1')).not.toBeInTheDocument());
  });

  it('reloads the grid on every queue tick through one stable callback', () => {
    const { rerender } = renderWithProviders(<AiPage />);
    const tick = gql.queue.onTick;
    tick?.();
    expect(crud.resource.reload).toHaveBeenCalledTimes(1);
    rerender(<AiPage />);
    expect(gql.queue.onTick).toBe(tick);
  });
});
