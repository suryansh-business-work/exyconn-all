import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { MockLink } from '@apollo/client/testing';
import {
  StartTableBulkJobDocument,
  TableBulkAction,
  TableBulkJobDocument,
  TableBulkJobStatus,
  type TableBulkJobInput,
} from '@/graphql/generated';
import { BulkJobStatus } from '@/components/data/BulkJobStatus';
import { useBulkJob, type BulkJob } from '@/components/data/useBulkJob';
import { portalLogger } from '@/logging/portalLogger';
import { answer, failure } from '../../mockResult';
import { renderWithProviders } from '../../test-utils';

const INPUT: TableBulkJobInput = {
  list: 'listLeadsPaged',
  action: TableBulkAction.Delete,
  ids: ['a', 'b', 'c'],
};
const POLL_WAIT = { timeout: 4_000 };

function jobOf(patch: Partial<BulkJob> = {}): BulkJob {
  return {
    __typename: 'TableBulkJob',
    id: 'job1',
    action: TableBulkAction.Delete,
    status: TableBulkJobStatus.Queued,
    total: 3,
    processed: 0,
    succeeded: 0,
    failedCount: 0,
    failures: [],
    error: null,
    ...patch,
  };
}

const started = (job = jobOf()) =>
  answer(StartTableBulkJobDocument, { startTableBulkJob: job }, { input: INPUT }).mock;
const polled = (job: BulkJob | null) =>
  answer(TableBulkJobDocument, { tableBulkJob: job }, { id: 'job1' }).mock;

function Harness({ onFinished }: Readonly<{ onFinished: (job: BulkJob) => void }>) {
  const control = useBulkJob(onFinished);
  const [refused, setRefused] = useState('');
  return (
    <>
      <button
        type="button"
        onClick={() => {
          control.start(INPUT).catch((error: Error) => setRefused(error.message));
        }}
      >
        Start
      </button>
      <BulkJobStatus control={control} />
      <output>{refused}</output>
      <span data-testid="running">{String(control.running)}</span>
    </>
  );
}

function renderHarness(mocks: ReadonlyArray<MockLink.MockedResponse>) {
  const onFinished = vi.fn();
  renderWithProviders(<Harness onFinished={onFinished} />, { mocks });
  fireEvent.click(screen.getByRole('button', { name: 'Start' }));
  return onFinished;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useBulkJob', () => {
  it('shows the job’s progress in the toolbar until it is done, then reports and hands it over', async () => {
    const done = jobOf({ status: TableBulkJobStatus.Done, processed: 3, succeeded: 3 });
    const onFinished = renderHarness([
      started(),
      polled(jobOf({ status: TableBulkJobStatus.Running, processed: 2 })),
      polled(done),
    ]);

    expect(await screen.findByText('Deleting 2 of 3…')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Deleting 2 of 3…' })).toHaveAttribute(
      'aria-valuenow',
      '67',
    );
    await waitFor(() => expect(onFinished).toHaveBeenCalledWith(done), POLL_WAIT);
    expect(await screen.findByText('3 rows deleted')).toBeInTheDocument();
    expect(screen.queryByText(/Deleting/)).not.toBeInTheDocument();
    expect(screen.getByTestId('running')).toHaveTextContent('false');
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('can hide the progress line while the job carries on, and still reports the end', async () => {
    const onFinished = renderHarness([
      started(jobOf({ total: 0 })),
      polled(jobOf({ status: TableBulkJobStatus.Running, total: 0 })),
      polled(
        jobOf({
          status: TableBulkJobStatus.Done,
          processed: 3,
          succeeded: 2,
          failedCount: 1,
          failures: [{ __typename: 'TableBulkFailure', id: 'c', message: 'Locked' }],
        }),
      ),
    ]);

    fireEvent.click(await screen.findByRole('button', { name: 'Hide progress' }));
    expect(screen.queryByText(/Deleting/)).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('running')).toHaveTextContent('true'));

    expect(await screen.findByText('2 done, 1 failed: Locked', {}, POLL_WAIT)).toBeInTheDocument();
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('reports why a job stopped, in the server’s words or a plain one', async () => {
    renderHarness([
      started(),
      polled(jobOf({ status: TableBulkJobStatus.Failed, error: 'Your role may not delete Lead' })),
    ]);
    expect(
      await screen.findByText('Your role may not delete Lead', {}, POLL_WAIT),
    ).toBeInTheDocument();
  });

  it('says the bulk action failed when a stopped job gives no reason', async () => {
    renderHarness([started(), polled(jobOf({ status: TableBulkJobStatus.Failed }))]);
    expect(await screen.findByText('The bulk action failed', {}, POLL_WAIT)).toBeInTheDocument();
  });

  it('stops following a job the server no longer knows', async () => {
    const onFinished = renderHarness([started(), polled(null)]);

    await screen.findByText(/Deleting/);
    await waitFor(
      () => expect(screen.getByTestId('running')).toHaveTextContent('false'),
      POLL_WAIT,
    );
    expect(screen.queryByText(/Deleting/)).not.toBeInTheDocument();
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('rejects when the server refuses to start the job', async () => {
    renderHarness([failure(StartTableBulkJobDocument, { input: INPUT }, 'Forbidden')]);
    expect(await screen.findByText('Forbidden')).toBeInTheDocument();
    expect(screen.getByTestId('running')).toHaveTextContent('false');
  });

  it('logs when the job’s progress cannot be read', async () => {
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    renderHarness([started(), failure(TableBulkJobDocument, { id: 'job1' })]);

    await waitFor(
      () =>
        expect(logged).toHaveBeenCalledWith('Could not read the bulk job', expect.any(Error), {
          jobId: 'job1',
        }),
      POLL_WAIT,
    );
  });
});
