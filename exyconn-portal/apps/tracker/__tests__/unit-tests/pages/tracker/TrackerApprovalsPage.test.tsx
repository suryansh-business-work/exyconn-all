import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TrackerManualEntryStatus,
  TrackerPendingManualEntriesDocument,
} from '@exyconn/shell/graphql/generated';
import { TrackerApprovalsPage } from '../../../../src/pages/tracker/TrackerApprovalsPage';
import { renderWithProviders } from '../../test-utils';
import { manualEntry, queryResult } from './tracker.fixtures';
import { resetRecorded, tableProps } from './tracker.mocks';

const gql = vi.hoisted(() => ({
  query: vi.fn(),
  mutation: vi.fn(),
  review: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerPendingManualEntriesQuery: gql.query,
  useReviewTrackerManualEntryMutation: gql.mutation,
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('./tracker.mocks')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./tracker.mocks')).dataTableModuleMock(),
);

const toast = () => screen.findByRole('alert', { hidden: true });

/** Presses a row action and answers the confirmation it raises; returns the dialog's text. */
async function decide(action: string, answer: string) {
  await userEvent.click(screen.getByRole('button', { name: action }));
  const dialog = await screen.findByRole('dialog');
  const text = dialog.textContent ?? '';
  await userEvent.click(within(dialog).getByRole('button', { name: answer }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  return text;
}

describe('TrackerApprovalsPage', () => {
  beforeEach(() => {
    resetRecorded();
    gql.refetch.mockReset().mockResolvedValue({});
    gql.review.mockReset().mockResolvedValue({ data: {} });
    gql.mutation.mockReset().mockReturnValue([gql.review]);
    gql.query
      .mockReset()
      .mockReturnValue(
        queryResult({ trackerPendingManualEntries: [manualEntry()] }, false, {
          refetch: gql.refetch,
        }),
      );
  });

  it('lists each claim with who, when, how long, which project and why', () => {
    renderWithProviders(<TrackerApprovalsPage />);
    expect(screen.getByRole('heading', { name: 'Off-computer time' })).toBeInTheDocument();
    expect(gql.query).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(gql.mutation).toHaveBeenCalledWith({
      refetchQueries: [TrackerPendingManualEntriesDocument],
    });
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('at 2026-01-15T09:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('at 2026-01-15T10:30:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
    expect(screen.getByText('Website rebuild')).toBeInTheDocument();
    expect(screen.getByText('Client workshop')).toBeInTheDocument();
    expect(tableProps().emptyMessage).toBe('Nothing waiting for review.');
    expect(tableProps().loading).toBe(false);
    expect(tableProps().onRefresh).toBe(gql.refetch);
  });

  it('shows a dash for time not booked to a project', () => {
    gql.query.mockReturnValue(
      queryResult({ trackerPendingManualEntries: [manualEntry({ projectName: '' })] }),
    );
    renderWithProviders(<TrackerApprovalsPage />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows an empty, busy queue until the first answer', () => {
    gql.query.mockReturnValue(queryResult(undefined, true));
    renderWithProviders(<TrackerApprovalsPage />);
    expect(tableProps().rows).toEqual([]);
    expect(tableProps().loading).toBe(true);
  });

  it('approves after warning that the hours will count and cannot be taken back', async () => {
    renderWithProviders(<TrackerApprovalsPage />);
    const text = await decide('Approve entry', 'Approve');
    expect(text).toContain('Approve this time?');
    expect(text).toContain(
      '1h 30m for Asha Rao will count towards their hours and any billing. This cannot be undone.',
    );
    expect(gql.review).toHaveBeenCalledWith({
      variables: { id: 'entry-1', status: TrackerManualEntryStatus.Approved },
    });
    expect(await toast()).toHaveTextContent('Time approved');
  });

  it('rejects after warning that the hours will not count', async () => {
    renderWithProviders(<TrackerApprovalsPage />);
    const text = await decide('Reject entry', 'Reject');
    expect(text).toContain('Reject this time?');
    expect(text).toContain('1h 30m for Asha Rao will not count. This cannot be undone.');
    expect(gql.review).toHaveBeenCalledWith({
      variables: { id: 'entry-1', status: TrackerManualEntryStatus.Rejected },
    });
    expect(await toast()).toHaveTextContent('Time rejected');
  });

  it('decides nothing when the confirmation is cancelled', async () => {
    renderWithProviders(<TrackerApprovalsPage />);
    await decide('Approve entry', 'Cancel');
    expect(gql.review).not.toHaveBeenCalled();
  });

  it('says why a decision could not be saved', async () => {
    gql.review.mockRejectedValue(new Error('Entry already reviewed'));
    renderWithProviders(<TrackerApprovalsPage />);
    await decide('Reject entry', 'Reject');
    expect(await toast()).toHaveTextContent('Entry already reviewed');
  });

  it('falls back to a plain message when the failure carries none', async () => {
    gql.review.mockRejectedValue(undefined);
    renderWithProviders(<TrackerApprovalsPage />);
    await decide('Approve entry', 'Approve');
    expect(await toast()).toHaveTextContent('Could not save the decision');
  });
});
