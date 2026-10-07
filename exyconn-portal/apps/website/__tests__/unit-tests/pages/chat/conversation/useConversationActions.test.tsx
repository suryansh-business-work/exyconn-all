import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useConversationActions } from '../../../../../src/pages/chat/conversation/useConversationActions';
import {
  downloadText,
  transcriptText,
} from '../../../../../src/pages/chat/conversation/transcript';
import type { ChatSession } from '../../../../../src/pages/chat/socket/chatSocket.types';
import { renderHookWithProviders, useCurrentUrl } from '../../../test-utils';
import { chatMessage, chatSession } from '../chat-fixtures';

const gql = vi.hoisted(() => ({
  claim: vi.fn(),
  remove: vi.fn(),
  close: vi.fn(),
  claiming: false,
}));
const settings = vi.hoisted(() => ({ formatDateTime: (value: string) => `on ${value}` }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useClaimWebsiteChatSessionMutation: () => [gql.claim, { loading: gql.claiming }],
  useDeleteWebsiteChatSessionMutation: () => [gql.remove],
  useCloseWebsiteChatSessionMutation: () => [gql.close],
}));
vi.mock('@exyconn/shell/hooks/useSettings', () => ({ useSettings: () => settings }));
vi.mock('../../../../../src/pages/chat/conversation/transcript', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../../../../src/pages/chat/conversation/transcript')
  >()),
  downloadText: vi.fn(),
}));

const MESSAGES = [chatMessage()];

function renderActions(session: ChatSession = chatSession()) {
  const { result } = renderHookWithProviders(
    () => ({ actions: useConversationActions(session, MESSAGES), url: useCurrentUrl() }),
    { route: '/website/chat/sessions/s1/live' },
  );
  return result;
}

describe('useConversationActions', () => {
  beforeEach(() => {
    gql.claim.mockReset().mockResolvedValue({ data: {} });
    gql.remove.mockReset().mockResolvedValue({ data: {} });
    gql.close.mockReset().mockResolvedValue({ data: {} });
    gql.claiming = false;
    vi.mocked(downloadText).mockClear();
  });

  it('claims the chat for the signed-in agent', async () => {
    const result = renderActions();
    act(() => result.current.actions.claim());

    expect(await screen.findByText('The chat is yours to answer')).toBeInTheDocument();
    expect(gql.claim).toHaveBeenCalledWith({ variables: { id: 's1' } });
  });

  it('says why a claim failed', async () => {
    gql.claim.mockRejectedValue(new Error('Already claimed by Ravi'));
    const result = renderActions();
    act(() => result.current.actions.claim());

    expect(await screen.findByText('Already claimed by Ravi')).toBeInTheDocument();
  });

  it('passes on whether a claim is under way', () => {
    gql.claiming = true;
    expect(renderActions().current.actions.claiming).toBe(true);
  });

  it('downloads the transcript named after the ticket, or the chat id without one', () => {
    const session = chatSession();
    renderActions(session).current.actions.download();
    renderActions(chatSession({ ticketReference: '' })).current.actions.download();

    expect(vi.mocked(downloadText).mock.calls[0]).toEqual([
      'chat-TCK-12.txt',
      transcriptText(session, MESSAGES, settings.formatDateTime, (source) => source),
    ]);
    expect(vi.mocked(downloadText).mock.calls[1][0]).toBe('chat-s1.txt');
  });

  it('deletes the chat after confirming and goes back to the list', async () => {
    const result = renderActions();
    act(() => result.current.actions.remove());

    expect(
      await screen.findByText(
        'Delete the chat with Asha Rao and every message in it? This cannot be undone.',
      ),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Chat deleted')).toBeInTheDocument();
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 's1' } });
    expect(result.current.url).toBe('/website/chat/sessions');
  });

  it('keeps the chat when the delete is cancelled', async () => {
    const result = renderActions();
    act(() => result.current.actions.remove());
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(gql.remove).not.toHaveBeenCalled();
    expect(result.current.url).toBe('/website/chat/sessions/s1/live');
  });

  it('says why a delete failed and stays on the chat', async () => {
    gql.remove.mockRejectedValue(new Error('Not allowed'));
    const result = renderActions();
    act(() => result.current.actions.remove());
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
    expect(result.current.url).toBe('/website/chat/sessions/s1/live');
  });

  it('closes the chat after confirming, staying on the page', async () => {
    const result = renderActions();
    act(() => result.current.actions.close());
    await userEvent.click(await screen.findByRole('button', { name: 'Close chat' }));

    expect(await screen.findByText('Chat closed')).toBeInTheDocument();
    expect(gql.close).toHaveBeenCalledWith({ variables: { id: 's1' } });
    expect(result.current.url).toBe('/website/chat/sessions/s1/live');
  });
});
