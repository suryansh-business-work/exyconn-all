import { useT } from '@exyconn/i18n';
import { Tabber, useTabberSlug, type TabberItem } from '@exyconn/tabber';
import { Box } from '@exyconn/shell/components/ui';
import { WebsiteChatChannel, WebsiteChatStatus } from '@exyconn/shell/graphql/generated';
import { useChatConsole } from '../chat.context';
import { chatSessionPath } from '../chat.routes';
import { ChatReplyClosed, ChatReplyForm } from '../forms/chat-reply';
import type { ChatSession } from '../socket/chatSocket.types';
import type { Conversation } from './useConversation';
import { MessageThread } from './MessageThread';
import { THREAD_TITLES } from './transcript';
import { useSendReply } from './useConversationLink';
import { useThreadUnread } from './useThreadUnread';

/** Each thread's URL slug: /website/chat/sessions/:id/live and …/knowledge. */
const SLUG: Record<WebsiteChatChannel, string> = {
  [WebsiteChatChannel.Live]: 'live',
  [WebsiteChatChannel.Knowledge]: 'knowledge',
};
const SLUGS = THREAD_TITLES.map(({ channel }) => SLUG[channel]);

interface ConversationThreadsProps {
  session: ChatSession;
  conversation: Conversation;
  /** From the chatbot settings; undefined until they load. */
  maxUploadMb: number | undefined;
}

/** A small dot on a thread tab with messages not yet looked at. */
function UnreadDot({ label }: Readonly<{ label: string }>) {
  return (
    <Box
      component="span"
      role="img"
      aria-label={label}
      sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }}
    />
  );
}

/** The two threads of the chat — "Chat with us" (live) and "Knowledge Bot" — as URL tabs. */
export function ConversationThreads({
  session,
  conversation,
  maxUploadMb,
}: Readonly<ConversationThreadsProps>) {
  const t = useT();
  const { prefs, send } = useChatConsole();
  const basePath = chatSessionPath(session.id);
  const { slug } = useTabberSlug(basePath, SLUGS);
  const active =
    slug === SLUG[WebsiteChatChannel.Knowledge]
      ? WebsiteChatChannel.Knowledge
      : WebsiteChatChannel.Live;
  const hasUnread = useThreadUnread(conversation.messages, session, active);
  const sendReply = useSendReply(session.id, conversation.addPending);
  const onTyping = (on: boolean) => {
    send({ t: 'typing', sessionId: session.id, on });
  };

  const liveComposer =
    session.status === WebsiteChatStatus.Closed ? (
      <ChatReplyClosed />
    ) : (
      maxUploadMb !== undefined && (
        <ChatReplyForm maxUploadMb={maxUploadMb} onSend={sendReply} onTyping={onTyping} />
      )
    );

  const items: TabberItem[] = THREAD_TITLES.map(({ channel, title }) => {
    const isLive = channel === WebsiteChatChannel.Live;
    return {
      slug: SLUG[channel],
      label: title,
      icon: hasUnread(channel) ? <UnreadDot label={t('New messages')} /> : undefined,
      content: (
        <MessageThread
          label={title}
          messages={conversation.messages.filter((message) => message.channel === channel)}
          pending={isLive ? conversation.pending : []}
          freshIds={conversation.freshIds}
          animate={prefs.animate}
          typingName={isLive ? conversation.typingName : null}
          onDismiss={conversation.dismissPending}
          composer={isLive ? liveComposer : undefined}
        />
      ),
    };
  });

  return <Tabber basePath={basePath} items={items} ariaLabel="Chat threads" sx={{ mb: 1.5 }} />;
}
