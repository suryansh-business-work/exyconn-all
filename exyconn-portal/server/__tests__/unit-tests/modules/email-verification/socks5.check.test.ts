import { connect } from 'node:net';
import { checkSocks5 } from '../../../../src/modules/email-verification/socks5.check';
import { asArg } from '../../../mockAs';
import { FakeSocket, settle } from './fakeSocket';

jest.mock('node:net', () => ({ connect: jest.fn() }));

const PROXY = { host: 'proxy.example.test', port: 1080 };
let socket: FakeSocket;

beforeEach(() => {
  jest.mocked(connect).mockImplementation(
    asArg((target: { host: string; port: number }) => {
      socket = new FakeSocket(target);
      return socket;
    }),
  );
});

/**
 * Starts a check and lets it reach the proxy, which accepts the TCP connection. The pending
 * result is wrapped so awaiting this helper does not wait for the whole check.
 */
async function connected(proxy: Parameters<typeof checkSocks5>[0]) {
  const result = checkSocks5(proxy);
  socket.emit('connect');
  await settle();
  return { result };
}

describe('checkSocks5', () => {
  it('agrees on SOCKS5 without signing in when the config has no username', async () => {
    const { result } = await connected(PROXY);
    socket.emit('data', Buffer.from([5, 0]));

    await expect(result).resolves.toBe('The SOCKS5 proxy answered and needs no sign-in.');
    expect(socket.target).toEqual(PROXY);
    expect(socket.timeoutMs).toBe(10_000);
    expect(socket.written).toEqual([Buffer.from([5, 1, 0])]);
    expect(socket.destroyed).toBe(true);
  });

  it('signs in with the username and password, each prefixed by its length (RFC 1929)', async () => {
    const { result } = await connected({ ...PROXY, username: 'ravi', password: 'pw1' });
    socket.emit('data', Buffer.from([5, 2]));
    await settle();
    socket.emit('data', Buffer.from([1, 0]));

    await expect(result).resolves.toBe('The SOCKS5 proxy accepted the username and password.');
    expect(socket.written[0]).toEqual(Buffer.from([5, 1, 2]));
    expect(socket.written[1]).toEqual(
      Buffer.concat([Buffer.from([1, 4]), Buffer.from('ravi'), Buffer.from([3]), Buffer.from('pw1')]),
    );
  });

  it('sends an empty password when only a username is set, and reports a refused sign-in', async () => {
    const { result } = await connected({ ...PROXY, username: 'ravi' });
    socket.emit('data', Buffer.from([5, 2]));
    await settle();
    socket.emit('data', Buffer.from([1, 1]));

    await expect(result).rejects.toThrow('The SOCKS5 proxy refused the username or password.');
    expect(socket.written[1]).toEqual(
      Buffer.concat([Buffer.from([1, 4]), Buffer.from('ravi'), Buffer.from([0])]),
    );
  });

  it('refuses a server that is not SOCKS5', async () => {
    const { result } = await connected(PROXY);
    socket.emit('data', Buffer.from([4, 0]));

    await expect(result).rejects.toThrow('The proxy is not a SOCKS5 proxy');
  });

  it('refuses a SOCKS5 proxy that will not take the offered way of signing in', async () => {
    const { result } = await connected({ ...PROXY, username: 'ravi', password: 'pw1' });
    socket.emit('data', Buffer.from([5, 0xff]));

    await expect(result).rejects.toThrow('refused this way of signing in');
    expect(socket.written).toHaveLength(1);
  });

  it('reports a connection the proxy refuses', async () => {
    const result = checkSocks5(PROXY);
    socket.emit('error', new Error('connect ECONNREFUSED'));

    await expect(result).rejects.toThrow('connect ECONNREFUSED');
    expect(socket.destroyed).toBe(true);
  });

  it('gives up on a proxy that never answers, naming it', async () => {
    const result = checkSocks5(PROXY);
    socket.idle();

    await expect(result).rejects.toThrow('No answer from proxy.example.test:1080.');
  });

  it('reports a proxy that hangs up in the middle of the handshake', async () => {
    const { result } = await connected(PROXY);
    socket.destroy();

    await expect(result).rejects.toThrow('The proxy closed the connection.');
  });
});
