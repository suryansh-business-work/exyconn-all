import { env } from '@exyconn/shell/config/env';

const CHAT_SOCKET_PATH = '/chat/ws';

/**
 * The chat socket lives on the portal API itself, next to /graphql: same host, `ws`/`wss` in
 * place of `http`/`https`, and `/chat/ws` in place of the GraphQL path.
 */
export function chatSocketUrl(): string {
  const url = new URL(env.graphqlUrl, globalThis.location.href);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = url.pathname.replace(/\/graphql\/?$/, '') + CHAT_SOCKET_PATH;
  url.search = '';
  url.hash = '';
  return url.toString();
}
