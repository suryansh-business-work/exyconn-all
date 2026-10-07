import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import {
  TrackerMessageDirection,
  TrackerMessageThreadDocument,
  TrackerMessageThreadsDocument,
} from '@exyconn/shell/graphql/generated';
import { TrackerMessageThread } from '../../../../src/pages/tracker/TrackerMessageThread';
import { renderWithProviders } from '../../test-utils';
import { resetThread, type ThreadState } from './thread.setup';
import { message, queryResult } from './tracker.fixtures';

const gql = vi.hoisted((): ThreadState => ({
  query: vi.fn(),
  markReadHook: vi.fn(),
  sendHook: vi.fn(),
  markRead: vi.fn(),
  send: vi.fn(),
  sending: false,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerMessageThreadQuery: gql.query,
  useMarkTrackerThreadReadMutation: gql.markReadHook,
  useSendTrackerMessageMutation: gql.sendHook,
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('./tracker.mocks')).settingsModuleMock(),
);

const EMPTY = 'Nothing has been said yet. Anything you write appears on their tracker.';
const renderThread = () =>
  renderWithProviders(<TrackerMessageThread userId="u1" userName="Asha Rao" />);

describe('TrackerMessageThread — reading', () => {
  beforeEach(() => {
    resetThread(gql);
  });

  it('polls the conversation and refreshes the inbox after reading or replying', () => {
    renderThread();
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(gql.query).toHaveBeenCalledWith({
      variables: { userId: 'u1' },
      fetchPolicy: 'cache-and-network',
      pollInterval: 15_000,
      context: { background: true },
    });
    expect(gql.markReadHook).toHaveBeenCalledWith({
      refetchQueries: [TrackerMessageThreadsDocument],
    });
    expect(gql.sendHook).toHaveBeenCalledWith({
      refetchQueries: [
        { query: TrackerMessageThreadDocument, variables: { userId: 'u1' } },
        TrackerMessageThreadsDocument,
      ],
    });
  });

  it("marks the employee's messages read as soon as the conversation opens", () => {
    renderThread();
    expect(gql.markRead).toHaveBeenCalledWith({ variables: { userId: 'u1' } });
  });

  it('carries on quietly when the badge cannot be cleared', async () => {
    gql.markRead.mockRejectedValue(new Error('offline'));
    renderThread();
    await waitFor(() => expect(gql.markRead).toHaveBeenCalledTimes(1));
    expect(screen.getByText(EMPTY)).toBeInTheDocument();
    expect(screen.queryByRole('alert', { hidden: true })).not.toBeInTheDocument();
  });

  it('shows a placeholder while the first messages load', () => {
    gql.query.mockReturnValue(queryResult(undefined, true));
    const { container } = renderThread();
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    expect(screen.queryByText(EMPTY)).not.toBeInTheDocument();
  });

  it('says nothing has been said yet in an empty conversation', () => {
    const { container } = renderThread();
    expect(screen.getByText(EMPTY)).toBeInTheDocument();
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeInTheDocument();
  });

  it("shows the employee's lines bare and signs the desk's own", () => {
    resetThread(gql, [
      message(),
      message({
        id: 'm2',
        direction: TrackerMessageDirection.ToEmployee,
        body: 'Yes, enjoy the long weekend.',
        authorName: 'Priya',
        createdAt: '2026-01-15T10:05:00.000Z',
      }),
      message({
        id: 'm3',
        direction: TrackerMessageDirection.ToEmployee,
        body: 'Office reopens Monday.',
        authorName: '',
        createdAt: '2026-01-15T10:06:00.000Z',
      }),
    ]);
    renderThread();
    expect(screen.getByText('Is Friday a holiday?')).toBeInTheDocument();
    expect(screen.getByText('at 2026-01-15T10:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('Yes, enjoy the long weekend.')).toBeInTheDocument();
    expect(screen.getByText(/^Priya · at 2026-01-15T10:05:00\.000Z$/)).toBeInTheDocument();
    expect(screen.getByText(/^Tracker desk · at 2026-01-15T10:06:00\.000Z$/)).toBeInTheDocument();
    expect(screen.queryByText(EMPTY)).not.toBeInTheDocument();
  });

  it('keeps the messages on screen during a background refresh', () => {
    gql.query.mockReturnValue(queryResult({ trackerMessageThread: [message()] }, true));
    const { container } = renderThread();
    expect(screen.getByText('Is Friday a holiday?')).toBeInTheDocument();
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeInTheDocument();
  });
});
