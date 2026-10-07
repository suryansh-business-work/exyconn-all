import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerMessageInbox } from '../../../../src/pages/tracker/TrackerMessageInbox';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { queryResult, thread } from './tracker.fixtures';

const state = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerMessageThreadsQuery: state.query,
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('./tracker.mocks')).settingsModuleMock(),
);
vi.mock('../../../../src/pages/tracker/TrackerMessageThread', () => ({
  TrackerMessageThread: ({ userId, userName }: Readonly<{ userId: string; userName: string }>) => (
    <h2>{`Conversation with ${userName} (${userId})`}</h2>
  ),
}));

const PROMPT = 'Pick a conversation to read and reply to it.';

function Url() {
  return <output>{useCurrentUrl()}</output>;
}

const renderInbox = (route = '/tracker/messages/inbox') =>
  renderWithProviders(
    <>
      <TrackerMessageInbox />
      <Url />
    </>,
    { route },
  );

describe('TrackerMessageInbox', () => {
  beforeEach(() => {
    state.query.mockReset().mockReturnValue(
      queryResult({
        trackerMessageThreads: [
          thread(),
          thread({ userId: 'u2', userName: 'Dev Mehta', lastMessageBody: 'Thanks!', unread: 0 }),
        ],
      }),
    );
  });

  it('polls the conversations in the background', () => {
    renderInbox();
    expect(state.query).toHaveBeenCalledWith({
      fetchPolicy: 'cache-and-network',
      pollInterval: 30_000,
      context: { background: true },
    });
  });

  it('lists who has written in and asks which conversation to open', () => {
    renderInbox();
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('Dev Mehta')).toBeInTheDocument();
    expect(screen.getByText(PROMPT)).toBeInTheDocument();
  });

  it('opens a conversation and puts it in the URL, so it can be linked to', async () => {
    renderInbox('/tracker/messages/inbox?tab=x');
    await userEvent.click(screen.getByRole('button', { name: /Dev Mehta/ }));
    expect(
      screen.getByRole('heading', { name: 'Conversation with Dev Mehta (u2)' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(PROMPT)).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      '/tracker/messages/inbox?tab=x&employee=u2',
    );
  });

  it('opens the conversation a link points at', () => {
    renderInbox('/tracker/messages/inbox?employee=u1');
    expect(
      screen.getByRole('heading', { name: 'Conversation with Asha Rao (u1)' }),
    ).toBeInTheDocument();
  });

  it('keeps asking when the linked employee has no conversation', () => {
    renderInbox('/tracker/messages/inbox?employee=nobody');
    expect(screen.getByText(PROMPT)).toBeInTheDocument();
  });

  it('shows a spinner until the conversations first arrive', () => {
    state.query.mockReturnValue(queryResult(undefined, true));
    renderInbox();
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByText('No conversations yet')).not.toBeInTheDocument();
    expect(screen.getByText(PROMPT)).toBeInTheDocument();
  });

  it('keeps the list on screen during a background refresh', () => {
    state.query.mockReturnValue(queryResult({ trackerMessageThreads: [] }, true));
    renderInbox();
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
