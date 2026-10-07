import { describe, expect, it } from 'vitest';
import { WebsiteChatChannel, WebsiteChatSender } from '@exyconn/shell/graphql/generated';
import { CHAT_PATHS, chatSessionPath } from '../../../../src/pages/chat/chat.routes';
import { isLiveVisitorMessage } from '../../../../src/pages/chat/chat.message';
import { chatMessage } from './chat-fixtures';

describe('chat routes', () => {
  it('keeps every Chatbot screen under /website/chat', () => {
    expect(CHAT_PATHS).toEqual({
      sessions: '/website/chat/sessions',
      knowledge: '/website/chat/knowledge',
      faqs: '/website/chat/faqs',
      settings: '/website/chat/settings',
    });
  });

  it('addresses one conversation by its id under the sessions list', () => {
    expect(chatSessionPath('abc123')).toBe('/website/chat/sessions/abc123');
  });
});

describe('isLiveVisitorMessage', () => {
  it('is true only for a visitor writing in the live thread', () => {
    expect(isLiveVisitorMessage(chatMessage())).toBe(true);
  });

  it('leaves questions to the knowledge bot to the bot', () => {
    expect(isLiveVisitorMessage(chatMessage({ channel: WebsiteChatChannel.Knowledge }))).toBe(
      false,
    );
  });

  it('ignores what the team, the bot and the system write', () => {
    for (const sender of [
      WebsiteChatSender.Agent,
      WebsiteChatSender.Bot,
      WebsiteChatSender.System,
    ]) {
      expect(isLiveVisitorMessage(chatMessage({ sender }))).toBe(false);
    }
  });
});
