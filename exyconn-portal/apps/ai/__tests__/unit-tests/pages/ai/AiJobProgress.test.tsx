import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { AiJobStatus } from '@exyconn/shell/graphql/generated';
import { AiJobProgress } from '../../../../src/pages/ai/AiJobProgress';
import { renderWithProviders } from '../../test-utils';

const QUEUED_AT = '2026-10-01T10:00:00.000Z';

function expectNoProgress() {
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(screen.queryByText(/Running…|Queued…/)).not.toBeInTheDocument();
}

describe('AiJobProgress', () => {
  it('says the model is answering while the job runs', () => {
    renderWithProviders(<AiJobProgress status={AiJobStatus.Running} />);
    expect(screen.getByText('Running… the model is answering.')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('says the job is waiting on the worker once it has been handed over', () => {
    renderWithProviders(<AiJobProgress status={AiJobStatus.Queued} queuedAt={QUEUED_AT} />);
    expect(
      screen.getByText('Queued… waiting for the AI worker to pick this up.'),
    ).toBeInTheDocument();
  });

  it('shows nothing for a draft nobody has run, even though it is QUEUED', () => {
    renderWithProviders(<AiJobProgress status={AiJobStatus.Queued} queuedAt={null} />);
    expectNoProgress();
  });

  it.each([AiJobStatus.Succeeded, AiJobStatus.Failed])('shows nothing for a %s job', (status) => {
    renderWithProviders(<AiJobProgress status={status} queuedAt={QUEUED_AT} />);
    expectNoProgress();
  });
});
