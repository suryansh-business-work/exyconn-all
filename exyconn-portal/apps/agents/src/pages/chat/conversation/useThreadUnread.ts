import { useEffect, useState } from 'react';
import { WebsiteChatChannel } from '@exyconn/shell/graphql/generated';
import type { ChatMessage, ChatSession } from '../socket/chatSocket.types';

type Counts = Record<WebsiteChatChannel, number>;

function countByChannel(messages: readonly ChatMessage[]): Counts {
  const counts: Counts = { [WebsiteChatChannel.Live]: 0, [WebsiteChatChannel.Knowledge]: 0 };
  for (const message of messages) {
    counts[message.channel] += 1;
  }
  return counts;
}

/**
 * Which thread tabs wear an unread dot: a thread that gained messages since it was last on
 * screen, and the live thread while the visitor has messages nobody on the team has read.
 */
export function useThreadUnread(
  messages: readonly ChatMessage[],
  session: ChatSession,
  active: WebsiteChatChannel,
): (channel: WebsiteChatChannel) => boolean {
  const counts = countByChannel(messages);
  const live = counts[WebsiteChatChannel.Live];
  const knowledge = counts[WebsiteChatChannel.Knowledge];
  const [seen, setSeen] = useState<Counts>(counts);

  useEffect(() => {
    const current = active === WebsiteChatChannel.Live ? live : knowledge;
    setSeen((previous) => ({ ...previous, [active]: current }));
  }, [active, live, knowledge]);

  return (channel) => {
    if (channel === active) {
      return false;
    }
    const unreadLive = channel === WebsiteChatChannel.Live && session.staffUnread > 0;
    return unreadLive || counts[channel] > seen[channel];
  };
}
