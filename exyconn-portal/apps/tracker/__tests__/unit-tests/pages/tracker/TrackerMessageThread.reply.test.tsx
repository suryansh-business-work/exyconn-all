import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerMessageThread } from '../../../../src/pages/tracker/TrackerMessageThread';
import { renderWithProviders } from '../../test-utils';
import { resetThread, type ThreadState } from './thread.setup';

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

const renderThread = () =>
  renderWithProviders(<TrackerMessageThread userId="u1" userName="Asha Rao" />);
const replyBox = () => screen.getByRole('textbox', { name: 'Reply' });
const sendButton = () => screen.getByRole('button', { name: 'Send reply' });
const toast = () => screen.findByRole('alert', { hidden: true });

describe('TrackerMessageThread — replying', () => {
  beforeEach(() => {
    resetThread(gql);
  });

  it('invites a reply by name and caps it at what the portal accepts', () => {
    renderThread();
    expect(replyBox()).toHaveAttribute('placeholder', 'Reply to Asha Rao…');
    expect(replyBox()).toHaveAttribute('maxlength', '2000');
    expect(sendButton()).toBeDisabled();
  });

  it('sends the trimmed reply and clears the box once the portal has it', async () => {
    renderThread();
    await userEvent.type(replyBox(), '  See you Monday  ');
    expect(sendButton()).toBeEnabled();
    await userEvent.click(sendButton());
    expect(gql.send).toHaveBeenCalledWith({ variables: { userId: 'u1', body: 'See you Monday' } });
    await waitFor(() => expect(replyBox()).toHaveValue(''));
  });

  it('sends on Enter', async () => {
    renderThread();
    await userEvent.type(replyBox(), 'Noted{Enter}');
    expect(gql.send).toHaveBeenCalledWith({ variables: { userId: 'u1', body: 'Noted' } });
    await waitFor(() => expect(replyBox()).toHaveValue(''));
  });

  it('starts a new line on Shift+Enter instead of sending', async () => {
    renderThread();
    await userEvent.type(replyBox(), 'Line one{Shift>}{Enter}{/Shift}Line two');
    expect(gql.send).not.toHaveBeenCalled();
    expect(replyBox()).toHaveValue('Line one\nLine two');
  });

  it('sends nothing for a reply of only spaces', async () => {
    renderThread();
    await userEvent.type(replyBox(), '   {Enter}');
    expect(sendButton()).toBeDisabled();
    expect(gql.send).not.toHaveBeenCalled();
  });

  it('keeps what was typed and says why when the send fails', async () => {
    gql.send.mockRejectedValue(new Error('Employee no longer has tracker access'));
    renderThread();
    await userEvent.type(replyBox(), 'Hello');
    await userEvent.click(sendButton());
    expect(await toast()).toHaveTextContent('Employee no longer has tracker access');
    expect(replyBox()).toHaveValue('Hello');
  });

  it('falls back to a plain message when the failure carries none', async () => {
    gql.send.mockRejectedValue('offline');
    renderThread();
    await userEvent.type(replyBox(), 'Hello{Enter}');
    expect(await toast()).toHaveTextContent('Could not send the message');
  });

  it('holds the box and refuses a second send while one is in flight', async () => {
    const { rerender } = renderThread();
    await userEvent.type(replyBox(), 'Hello');
    gql.sending = true;
    rerender(<TrackerMessageThread userId="u1" userName="Asha Rao" />);
    expect(replyBox()).toBeDisabled();
    expect(sendButton()).toBeDisabled();
    fireEvent.keyDown(replyBox(), { key: 'Enter' });
    expect(gql.send).not.toHaveBeenCalled();
  });
});
