import { WebsiteChatChannel, WebsiteChatSender } from '@exyconn/shell/graphql/generated';
import type { ChatMessage } from './socket/chatSocket.types';

/**
 * A visitor writing in the live thread — the messages a person on the team has to answer.
 * Questions to the knowledge bot are the bot's to answer.
 */
export const isLiveVisitorMessage = (message: ChatMessage): boolean =>
  message.sender === WebsiteChatSender.Visitor && message.channel === WebsiteChatChannel.Live;
