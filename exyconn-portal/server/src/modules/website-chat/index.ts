/**
 * Website > Chatbot: the chat widget on exyconn.com and tools.exyconn.com.
 *
 * A visitor proves their email with a one-time code, which opens a chat session and a support
 * ticket. The conversation runs over a WebSocket (/chat/ws, chat.socket.ts) in two threads —
 * the team ("Chat with us") and a knowledge bot answering only from exyconn.com's content and
 * the team's own notes — plus FAQs. A live question nobody answers in time, or one asked
 * outside opening hours, is handed to the bot (chat.handoff.ts).
 */
export { websiteChatTypeDefs } from './chat.typeDefs';
export { websiteChatLibraryTypeDefs } from './chat.library.typeDefs';
export { websiteChatResolvers } from './chat.resolvers';
export { websiteChatLibraryResolvers } from './chat.library';
export { attachChatSocket, CHAT_SOCKET_PATH } from './chat.socket';
export { startChatHandoff } from './chat.handoff';
export { SLACK_EVENTS_PATH, slackEventsRouter } from './chat.slack';
