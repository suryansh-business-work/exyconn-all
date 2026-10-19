import { connect, type Socket } from 'node:net';
import type { ReacherProxy } from './reacher.client';

/** Past this the proxy is called unreachable. */
const TIMEOUT_MS = 10_000;

const SOCKS_VERSION = 5;
const NO_AUTH = 0x00;
const USER_PASS = 0x02;
const USER_PASS_VERSION = 1;

/** The next chunk the proxy sends, or a rejection when it closes or stays silent. */
function nextReply(socket: Socket): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    socket.once('data', resolve);
    socket.once('error', reject);
    socket.once('close', () => reject(new Error('The proxy closed the connection.')));
  });
}

/** RFC 1929: the username and password, each prefixed by its length. */
function credentialsPacket(username: string, password: string): Buffer {
  const user = Buffer.from(username);
  const pass = Buffer.from(password);
  return Buffer.concat([
    Buffer.from([USER_PASS_VERSION, user.length]),
    user,
    Buffer.from([pass.length]),
    pass,
  ]);
}

async function handshake(socket: Socket, proxy: ReacherProxy): Promise<string> {
  const { username } = proxy;
  const method = username ? USER_PASS : NO_AUTH;
  socket.write(Buffer.from([SOCKS_VERSION, 1, method]));
  const greeting = await nextReply(socket);
  if (greeting[0] !== SOCKS_VERSION || greeting[1] !== method) {
    throw new Error('The proxy is not a SOCKS5 proxy, or refused this way of signing in.');
  }
  if (!username) {
    return 'The SOCKS5 proxy answered and needs no sign-in.';
  }
  socket.write(credentialsPacket(username, proxy.password ?? ''));
  const auth = await nextReply(socket);
  if (auth[1] !== 0) {
    throw new Error('The SOCKS5 proxy refused the username or password.');
  }
  return 'The SOCKS5 proxy accepted the username and password.';
}

/**
 * Proves a proxy config without sending any mail: connects, agrees on SOCKS5 and, when a
 * username is set, signs in (RFC 1928 / 1929). Resolves to what to tell the person.
 */
export function checkSocks5(proxy: ReacherProxy): Promise<string> {
  const socket = connect({ host: proxy.host, port: proxy.port });
  socket.setTimeout(TIMEOUT_MS, () =>
    socket.destroy(new Error(`No answer from ${proxy.host}:${proxy.port}.`)),
  );
  return new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('error', reject);
  })
    .then(() => handshake(socket, proxy))
    .finally(() => socket.destroy());
}
