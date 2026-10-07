import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { WebsiteChatStatus } from '@exyconn/shell/graphql/generated';
import { ChatConversationPage } from '../../../../../src/pages/chat/conversation/ChatConversationPage';
import { useConversation } from '../../../../../src/pages/chat/conversation/useConversation';
import { useConversationActions } from '../../../../../src/pages/chat/conversation/useConversationActions';
import { useWatchConversation } from '../../../../../src/pages/chat/conversation/useConversationLink';
import { renderWithProviders } from '../../../test-utils';
import { chatMessage, chatSession } from '../chat-fixtures';

const seen = vi.hoisted(() => ({
  header: null as Record<string, unknown> | null,
  threads: null as Record<string, unknown> | null,
  user: null as { id: string } | null,
  settings: undefined as { websiteChatSettings: { maxUploadMb: number } } | undefined,
}));
const actions = vi.hoisted(() => ({
  claim: vi.fn(),
  claiming: true,
  close: vi.fn(),
  download: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useWebsiteChatSettingsQuery: () => ({ data: seen.settings }),
}));
vi.mock('@exyconn/shell/auth/AuthContext', () => ({ useAuth: () => ({ user: seen.user }) }));
vi.mock('../../../../../src/pages/chat/conversation/useConversation', () => ({
  useConversation: vi.fn(),
}));
vi.mock('../../../../../src/pages/chat/conversation/useConversationActions', () => ({
  useConversationActions: vi.fn(() => actions),
}));
vi.mock('../../../../../src/pages/chat/conversation/useConversationLink', () => ({
  useWatchConversation: vi.fn(),
}));
vi.mock('../../../../../src/pages/chat/conversation/ConversationHeader', () => ({
  ConversationHeader: (props: Record<string, unknown>) => {
    seen.header = props;
    return <h1>Header</h1>;
  },
}));
vi.mock('../../../../../src/pages/chat/conversation/ConversationThreads', () => ({
  ConversationThreads: (props: Record<string, unknown>) => {
    seen.threads = props;
    return <p>Threads</p>;
  },
}));

const MESSAGES = [chatMessage()];

function conversationWith(state: Partial<ReturnType<typeof useConversation>>) {
  vi.mocked(useConversation).mockReturnValue({
    session: undefined,
    messages: MESSAGES,
    freshIds: new Set(),
    pending: [],
    addPending: vi.fn(),
    dismissPending: vi.fn(),
    typingName: null,
    loading: false,
    error: undefined,
    ...state,
  });
}

const openPage = (route = '/website/chat/sessions/s1/live') =>
  renderWithProviders(<ChatConversationPage />, {
    route,
    path: '/website/chat/sessions/:id/*',
  });

describe('ChatConversationPage', () => {
  beforeEach(() => {
    vi.mocked(useConversation).mockReset();
    vi.mocked(useWatchConversation).mockClear();
    seen.header = null;
    seen.threads = null;
    seen.user = { id: 'agent-1' };
    seen.settings = { websiteChatSettings: { maxUploadMb: 8 } };
  });

  it('loads the chat named in the address and keeps watching it', () => {
    const session = chatSession();
    conversationWith({ session });
    openPage();

    expect(useConversation).toHaveBeenCalledWith('s1');
    expect(useWatchConversation).toHaveBeenCalledWith('s1', session);
    expect(useConversationActions).toHaveBeenCalledWith(session, MESSAGES);
    expect(document.title).toContain('Asha Rao');
  });

  it('hands the header the chat, who owns it and every action', () => {
    const session = chatSession({ assigneeId: 'agent-1', status: WebsiteChatStatus.Closed });
    conversationWith({ session });
    openPage();

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(seen.header).toEqual({
      session,
      isMine: true,
      isClosed: true,
      claiming: true,
      onClaim: actions.claim,
      onClose: actions.close,
      onDownload: actions.download,
      onDelete: actions.remove,
    });
  });

  it('gives the threads the conversation and the upload limit from the settings', () => {
    const session = chatSession();
    conversationWith({ session });
    openPage();

    expect(seen.threads).toMatchObject({ session, maxUploadMb: 8 });
    expect(seen.header).toMatchObject({ isMine: false, isClosed: false });
  });

  it('treats the chat as nobody’s when no one is signed in, and waits for the settings', () => {
    seen.user = null;
    seen.settings = undefined;
    conversationWith({ session: chatSession({ assigneeId: '' }) });
    openPage();

    expect(seen.header).toMatchObject({ isMine: false });
    expect(seen.threads).toMatchObject({ maxUploadMb: undefined });
  });

  it('shows a spinner while the chat loads', () => {
    conversationWith({ loading: true });
    openPage();

    expect(
      screen.getByRole('progressbar', { name: 'Loading the conversation' }),
    ).toBeInTheDocument();
    expect(seen.header).toBeNull();
  });

  it('explains when the chat cannot be opened', () => {
    conversationWith({ error: new Error('Chat not found') });
    openPage();

    expect(screen.getByText('This chat could not be opened')).toBeInTheDocument();
    expect(screen.getByText('Chat not found')).toBeInTheDocument();
  });

  it('guesses it was deleted when there is no error to show', () => {
    conversationWith({});
    renderWithProviders(<ChatConversationPage />);

    expect(useConversation).toHaveBeenCalledWith('');
    expect(screen.getByText('It may have been deleted.')).toBeInTheDocument();
  });
});
