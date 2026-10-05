import { useParams } from 'react-router-dom';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { usePageTitle } from '@exyconn/shell/components/layout/usePageTitle';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { WebsiteChatStatus, useWebsiteChatSettingsQuery } from '@exyconn/shell/graphql/generated';
import type { ChatSession } from '../socket/chatSocket.types';
import { ConversationHeader } from './ConversationHeader';
import { ConversationThreads } from './ConversationThreads';
import { useConversation, type Conversation } from './useConversation';
import { useConversationActions } from './useConversationActions';
import { useWatchConversation } from './useConversationLink';

/** The loaded conversation: the visitor's details and actions, then the two threads. */
function ConversationView({
  session,
  conversation,
}: Readonly<{ session: ChatSession; conversation: Conversation }>) {
  const { user } = useAuth();
  const { data: settingsData } = useWebsiteChatSettingsQuery();
  const actions = useConversationActions(session, conversation.messages);
  usePageTitle(session.name);

  return (
    <>
      <ConversationHeader
        session={session}
        isMine={Boolean(user && session.assigneeId === user.id)}
        isClosed={session.status === WebsiteChatStatus.Closed}
        claiming={actions.claiming}
        onClaim={actions.claim}
        onClose={actions.close}
        onDownload={actions.download}
        onDelete={actions.remove}
      />
      <ConversationThreads
        session={session}
        conversation={conversation}
        maxUploadMb={settingsData?.websiteChatSettings.maxUploadMb}
      />
    </>
  );
}

/** Loads one chat by id and keeps it live over the chat socket while it is on screen. */
function ChatConversation({ sessionId }: Readonly<{ sessionId: string }>) {
  const conversation = useConversation(sessionId);
  const { session, loading, error } = conversation;
  useWatchConversation(sessionId, session);

  if (session) {
    return <ConversationView session={session} conversation={conversation} />;
  }
  if (loading) {
    return <LoadingState label="Loading the conversation" />;
  }
  return (
    <EmptyState
      title="This chat could not be opened"
      description={errorMessage(error, 'It may have been deleted.')}
    />
  );
}

/**
 * Website > Chatbot > Chat Sessions > one conversation. Keyed by id, so opening another chat
 * starts from a clean slate rather than carrying the last chat's live messages over.
 */
export function ChatConversationPage() {
  const { id = '' } = useParams();
  return <ChatConversation key={id} sessionId={id} />;
}
