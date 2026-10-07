import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebsiteChatChannel, WebsiteChatStatus } from '@exyconn/shell/graphql/generated';
import { ConversationThreads } from '../../../../../src/pages/chat/conversation/ConversationThreads';
import type { Conversation } from '../../../../../src/pages/chat/conversation/useConversation';
import { optimisticMessage } from '../../../../../src/pages/chat/conversation/conversation.messages';
import type { ChatSession } from '../../../../../src/pages/chat/socket/chatSocket.types';
import { useCurrentUrl } from '../../../test-utils';
import { chatMessage, chatSession } from '../chat-fixtures';
import { fakeConsole, renderWithConsole, type FakeConsole } from '../chat-console';

interface ComposerProps {
  maxUploadMb: number;
  onSend: (body: string, files: []) => boolean;
  onTyping: (on: boolean) => void;
}

vi.mock('@exyconn/shell/auth/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Ravi' } }) }));
vi.mock('../../../../../src/pages/chat/forms/chat-reply', () => ({
  ChatReplyClosed: () => <p>Replies are off</p>,
  ChatReplyForm: ({ maxUploadMb, onSend, onTyping }: Readonly<ComposerProps>) => (
    <div>
      <p>{`Composer up to ${maxUploadMb} MB`}</p>
      <button type="button" onClick={() => onSend('Hello there', [])}>
        Stub send
      </button>
      <button type="button" onClick={() => onTyping(true)}>
        Stub type
      </button>
    </div>
  ),
}));

const MESSAGES = [
  chatMessage({ id: 'l1', body: 'Live question' }),
  chatMessage({ id: 'k1', channel: WebsiteChatChannel.Knowledge, body: 'Bot question' }),
];

/** A reply on its way to the server. */
const WAITING = [
  {
    clientId: 'c1',
    failed: false,
    message: optimisticMessage({
      clientId: 'c1',
      sessionId: 's1',
      senderName: 'Ravi',
      body: 'Wait',
      files: [],
    }),
  },
];

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    session: undefined,
    messages: MESSAGES,
    freshIds: new Set<string>(),
    pending: [],
    addPending: vi.fn(),
    dismissPending: vi.fn(),
    typingName: null,
    loading: false,
    error: undefined,
    ...overrides,
  };
}

function UrlProbe() {
  return <output aria-label="current url">{useCurrentUrl()}</output>;
}

interface Setup {
  session?: ChatSession;
  current?: Conversation;
  maxUploadMb?: number;
  route?: string;
  chat?: FakeConsole;
}

function renderThreads(setup: Setup = {}) {
  const {
    session = chatSession(),
    current = conversation(),
    route = '/website/chat/sessions/s1/live',
    chat = fakeConsole(),
  } = setup;
  const maxUploadMb = 'maxUploadMb' in setup ? setup.maxUploadMb : 5;
  renderWithConsole(
    <>
      <ConversationThreads session={session} conversation={current} maxUploadMb={maxUploadMb} />
      <UrlProbe />
    </>,
    () => chat,
    { route },
  );
  return { chat, current };
}

const url = () => screen.getByLabelText('current url').textContent;

describe('ConversationThreads', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('opens the live thread by default, with only its messages and the reply box', async () => {
    renderThreads({ route: '/website/chat/sessions/s1' });

    await waitFor(() => expect(url()).toBe('/website/chat/sessions/s1/live'));
    expect(screen.getByRole('tab', { name: /Chat with us/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const log = screen.getByRole('log', { name: 'Chat with us' });
    expect(within(log).getByText('Live question')).toBeInTheDocument();
    expect(within(log).queryByText('Bot question')).not.toBeInTheDocument();
    expect(screen.getByText('Composer up to 5 MB')).toBeInTheDocument();
  });

  it('shows the knowledge bot thread from its own address, without a reply box', () => {
    renderThreads({
      route: '/website/chat/sessions/s1/knowledge',
      current: conversation({ pending: WAITING, typingName: 'Asha' }),
    });

    const log = screen.getByRole('log', { name: 'Knowledge Bot' });
    expect(within(log).getByText('Bot question')).toBeInTheDocument();
    expect(within(log).queryByText('Live question')).not.toBeInTheDocument();
    expect(screen.queryByText('Sending…')).not.toBeInTheDocument();
    expect(screen.queryByText('Asha is typing…')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Composer/)).not.toBeInTheDocument();
  });

  it('switches thread through the tabs', async () => {
    renderThreads();
    await userEvent.click(screen.getByRole('tab', { name: /Knowledge Bot/ }));
    expect(url()).toBe('/website/chat/sessions/s1/knowledge');
  });

  it('keeps the replies on their way and the typing visitor in the live thread', () => {
    renderThreads({ current: conversation({ pending: WAITING, typingName: 'Asha' }) });

    expect(screen.getByText('Sending…')).toBeInTheDocument();
    expect(screen.getByText('Asha is typing…')).toBeInTheDocument();
  });

  it('tells the visitor the agent is typing', async () => {
    const { chat } = renderThreads();
    await userEvent.click(screen.getByRole('button', { name: 'Stub type' }));
    expect(chat.send).toHaveBeenCalledWith({ t: 'typing', sessionId: 's1', on: true });
  });

  it('sends a reply over the socket and shows it as pending', async () => {
    const { chat, current } = renderThreads();
    await userEvent.click(screen.getByRole('button', { name: 'Stub send' }));

    expect(chat.send).toHaveBeenCalledWith(
      expect.objectContaining({ t: 'send', sessionId: 's1', body: 'Hello there', files: [] }),
    );
    expect(current.addPending).toHaveBeenCalledTimes(1);
  });

  it('switches replies off on a closed chat', () => {
    renderThreads({ session: chatSession({ status: WebsiteChatStatus.Closed }) });
    expect(screen.getByText('Replies are off')).toBeInTheDocument();
  });

  it('waits for the upload limit before offering the reply box', () => {
    renderThreads({ maxUploadMb: undefined });
    expect(screen.queryByText(/^Composer/)).not.toBeInTheDocument();
    expect(screen.queryByText('Replies are off')).not.toBeInTheDocument();
  });

  it('dots the live tab while the visitor waits for an answer', () => {
    renderThreads({
      route: '/website/chat/sessions/s1/knowledge',
      session: chatSession({ staffUnread: 2 }),
    });

    const live = screen.getByRole('tab', { name: /Chat with us/ });
    expect(within(live).getByRole('img', { name: 'New messages' })).toBeInTheDocument();
    const knowledge = screen.getByRole('tab', { name: /Knowledge Bot/ });
    expect(within(knowledge).queryByRole('img')).not.toBeInTheDocument();
  });
});
