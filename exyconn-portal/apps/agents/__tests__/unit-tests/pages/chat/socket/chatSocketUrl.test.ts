import { describe, expect, it, vi } from 'vitest';
import { chatSocketUrl } from '../../../../../src/pages/chat/socket/chatSocketUrl';

const env = vi.hoisted(() => ({ graphqlUrl: '' }));
vi.mock('@exyconn/shell/config/env', () => ({ env }));

describe('chatSocketUrl', () => {
  it('swaps https for wss and the GraphQL path for /chat/ws', () => {
    env.graphqlUrl = 'https://portal-server.exyconn.com/graphql';
    expect(chatSocketUrl()).toBe('wss://portal-server.exyconn.com/chat/ws');
  });

  it('uses ws for a plain-http API and keeps its port', () => {
    env.graphqlUrl = 'http://localhost:1002/graphql';
    expect(chatSocketUrl()).toBe('ws://localhost:1002/chat/ws');
  });

  it('drops a trailing slash, the query string and the hash', () => {
    env.graphqlUrl = 'https://api.example.test/graphql/?debug=1#top';
    expect(chatSocketUrl()).toBe('wss://api.example.test/chat/ws');
  });

  it('keeps a path prefix the API is mounted under', () => {
    env.graphqlUrl = 'https://api.example.test/v1/graphql';
    expect(chatSocketUrl()).toBe('wss://api.example.test/v1/chat/ws');
  });

  it('resolves a relative GraphQL path against the page the portal is served from', () => {
    env.graphqlUrl = '/graphql';
    const { host } = globalThis.location;
    expect(chatSocketUrl()).toBe(`ws://${host}/chat/ws`);
  });
});
