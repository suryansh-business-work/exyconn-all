import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCloseChat } from '../../../../src/pages/chat/useCloseChat';
import { renderHookWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ close: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCloseWebsiteChatSessionMutation: () => [gql.close],
}));

const CHAT = { id: 's7', name: 'Asha Rao' };
const PROMPT = 'End the chat with Asha Rao? They can start a new one from the widget.';

function startClosing(onClosed = vi.fn()) {
  const { result } = renderHookWithProviders(() => useCloseChat(onClosed));
  act(() => result.current(CHAT));
  return onClosed;
}

describe('useCloseChat', () => {
  beforeEach(() => {
    gql.close.mockReset().mockResolvedValue({ data: {} });
  });

  it('asks first, then closes the chat and lets the caller refresh', async () => {
    const onClosed = startClosing();

    expect(await screen.findByText(PROMPT)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close chat' }));

    expect(await screen.findByText('Chat closed')).toBeInTheDocument();
    expect(gql.close).toHaveBeenCalledWith({ variables: { id: 's7' } });
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the agent changes their mind', async () => {
    const onClosed = startClosing();
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText(PROMPT)).not.toBeInTheDocument());
    expect(gql.close).not.toHaveBeenCalled();
    expect(onClosed).not.toHaveBeenCalled();
  });

  it('says why the chat could not be closed', async () => {
    gql.close.mockRejectedValue(new Error('The chat is already closed'));
    const onClosed = startClosing();
    await userEvent.click(await screen.findByRole('button', { name: 'Close chat' }));

    expect(await screen.findByText('The chat is already closed')).toBeInTheDocument();
    expect(onClosed).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure has none', async () => {
    gql.close.mockRejectedValue('socket hang up');
    startClosing();
    await userEvent.click(await screen.findByRole('button', { name: 'Close chat' }));

    expect(await screen.findByText('Could not close the chat')).toBeInTheDocument();
  });
});
