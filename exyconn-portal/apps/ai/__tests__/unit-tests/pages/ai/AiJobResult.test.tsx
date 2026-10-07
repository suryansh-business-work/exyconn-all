import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AiJobStatus } from '@exyconn/shell/graphql/generated';
import type { WatchedAiJob } from '../../../../src/pages/ai/useAiJob';
import { AiJobResult } from '../../../../src/pages/ai/AiJobResult';
import { renderWithProviders } from '../../test-utils';
import { jobDetail } from './ai-fixtures';

const watched = vi.hoisted(() => ({
  id: '',
  value: { loading: false, waiting: false } as WatchedAiJob,
}));

vi.mock('../../../../src/pages/ai/useAiJob', () => ({
  useAiJob: (id: string) => {
    watched.id = id;
    return watched.value;
  },
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDateTime: (value: string) => `at ${value}` }),
}));

const RAN_AT = '2026-10-01T10:00:00.000Z';

describe('AiJobResult', () => {
  beforeEach(() => {
    watched.value = { loading: false, waiting: false };
  });

  it('watches the job it was opened on and says it is loading until it arrives', () => {
    watched.value = { loading: true, waiting: true };
    renderWithProviders(<AiJobResult id="job-42" />);
    expect(watched.id).toBe('job-42');
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('says so when the job has gone', () => {
    renderWithProviders(<AiJobResult id="job-42" />);
    expect(screen.getByText('This job is no longer available.')).toBeInTheDocument();
  });

  it('shows what a finished run produced and what it cost', () => {
    watched.value = { job: jobDetail({ ranAt: RAN_AT }), loading: false, waiting: false };
    renderWithProviders(<AiJobResult id="job-1" />);
    expect(screen.getByText('Weekly digest')).toBeInTheDocument();
    expect(screen.getByText('SUCCEEDED')).toBeInTheDocument();
    expect(screen.getByText('gpt-4o-mini')).toBeInTheDocument();
    expect(screen.getByText('Asha')).toBeInTheDocument();
    const tokens = [1234, 1000, 234].map((n) => n.toLocaleString());
    expect(
      screen.getByText(`${tokens[0]} (${tokens[1]} prompt + ${tokens[2]} completion)`),
    ).toBeInTheDocument();
    expect(screen.getByText('$0.0123')).toBeInTheDocument();
    expect(screen.getByText('1.50s')).toBeInTheDocument();
    expect(screen.getByText(`at ${RAN_AT}`)).toBeInTheDocument();
    expect(screen.getByText('Summarise the week')).toBeInTheDocument();
    expect(screen.getByText('A quiet week.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('marks a job nobody has run yet instead of inventing a runner, cost or date', () => {
    watched.value = {
      job: jobDetail({
        status: AiJobStatus.Queued,
        queuedAt: null,
        ranAt: null,
        createdByName: '',
        response: '',
        costUsd: 0,
        latencyMs: 0,
      }),
      loading: false,
      waiting: false,
    };
    renderWithProviders(<AiJobResult id="job-1" />);
    expect(screen.getAllByText('Not run yet')).toHaveLength(2);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('0.00s')).toBeInTheDocument();
    expect(screen.getByText('Nothing yet — run the job to get an answer.')).toBeInTheDocument();
  });

  it('shows the progress line and holds back the answer while the worker owes one', () => {
    watched.value = {
      job: jobDetail({ status: AiJobStatus.Running, response: '' }),
      loading: false,
      waiting: true,
    };
    renderWithProviders(<AiJobResult id="job-1" />);
    expect(screen.getByText('Running… the model is answering.')).toBeInTheDocument();
    expect(
      screen.queryByText('Nothing yet — run the job to get an answer.'),
    ).not.toBeInTheDocument();
  });

  it('shows the reason a run failed instead of an answer', () => {
    watched.value = {
      job: jobDetail({ status: AiJobStatus.Failed, error: 'Quota exceeded', response: 'stale' }),
      loading: false,
      waiting: false,
    };
    renderWithProviders(<AiJobResult id="job-1" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Quota exceeded');
    expect(screen.queryByText('stale')).not.toBeInTheDocument();
  });
});
