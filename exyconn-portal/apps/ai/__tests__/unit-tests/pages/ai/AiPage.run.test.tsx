import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { AiPage } from '../../../../src/pages/ai/AiPage';
import { renderWithProviders } from '../../test-utils';
import { crud, dashboardProps, rowAction } from './crud-stub';
import { pagedJob } from './ai-fixtures';

const gql = vi.hoisted(() => ({
  runAiJob: vi.fn(),
  queue: { inFlight: 0, refresh: vi.fn() },
}));

vi.mock('@exyconn/crud', async (orig) => ({
  ...(await orig<typeof import('@exyconn/crud')>()),
  ...(await import('./crud-stub')).crudMocks,
}));

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useListAiJobsStatsQuery: () => ({ loading: false, refetch: vi.fn() }),
  useDeleteAiJobMutation: () => [vi.fn()],
  useRunAiJobMutation: () => [gql.runAiJob],
}));

vi.mock('../../../../src/pages/ai/useAiJobQueue', () => ({
  useAiJobQueue: () => gql.queue,
}));

const ROW = pagedJob({ id: 'job-7', name: 'Release notes' });

async function run() {
  await act(async () => {
    await rowAction('run')(ROW);
  });
}

describe('AiPage — running a job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.queue.inFlight = 0;
  });

  it('queues the run, says so, and reloads the grid and the queue watcher', async () => {
    gql.runAiJob.mockResolvedValue({ data: { runAiJob: { id: 'job-7' } } });
    gql.queue.refresh.mockResolvedValue(undefined);
    renderWithProviders(<AiPage />);
    await run();
    expect(gql.runAiJob).toHaveBeenCalledWith({ variables: { id: 'job-7' } });
    expect(await screen.findByText('"Release notes" queued')).toBeInTheDocument();
    expect(crud.resource.reload).toHaveBeenCalledTimes(1);
    expect(gql.queue.refresh).toHaveBeenCalledTimes(1);
  });

  it('reports why the run could not start, without reloading', async () => {
    gql.runAiJob.mockRejectedValue(new Error('The monthly AI budget is spent'));
    renderWithProviders(<AiPage />);
    await run();
    expect(await screen.findByText('The monthly AI budget is spent')).toBeInTheDocument();
    expect(crud.resource.reload).not.toHaveBeenCalled();
    expect(gql.queue.refresh).not.toHaveBeenCalled();
  });

  it('falls back to a plain sentence when the failure carries no message', async () => {
    gql.runAiJob.mockRejectedValue('offline');
    renderWithProviders(<AiPage />);
    await run();
    expect(await screen.findByText('The run could not be started')).toBeInTheDocument();
  });
});

describe('AiPage — queue notice', () => {
  beforeEach(() => {
    gql.queue.inFlight = 0;
  });

  it('says nothing while no job is waiting', () => {
    renderWithProviders(<AiPage />);
    expect(dashboardProps().toolbar).toBeUndefined();
  });

  it('says one job is waiting as a whole sentence', () => {
    gql.queue.inFlight = 1;
    renderWithProviders(<AiPage />);
    expect(
      screen.getByText(
        '1 job is waiting on the AI worker. This list refreshes itself until it finishes.',
      ),
    ).toBeInTheDocument();
  });

  it('counts several waiting jobs', () => {
    gql.queue.inFlight = 3;
    renderWithProviders(<AiPage />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      '3 jobs are waiting on the AI worker. This list refreshes itself until they finish.',
    );
  });
});
