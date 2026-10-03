import { EventEmitter } from 'node:events';
import { connect } from 'node:tls';
import { readCertificate } from '../../src/modules/security/ssl.probe';
import { assertPublicHttpsUrl, UnsafeUrlError } from '../../src/utils/safeFetch';

jest.mock('node:tls', () => ({ connect: jest.fn() }));
jest.mock('../../src/utils/safeFetch', () => {
  const actual = jest.requireActual('../../src/utils/safeFetch');
  return { ...actual, assertPublicHttpsUrl: jest.fn() };
});

const connectMock = connect as jest.Mock;
const publicCheck = assertPublicHttpsUrl as jest.Mock;

/** A stand-in TLS socket: the test decides which event it emits. */
class FakeSocket extends EventEmitter {
  authorized = false;
  authorizationError: string | undefined = 'CERT_HAS_EXPIRED';
  protocol: string | null = 'TLSv1.2';
  readonly end = jest.fn();
  readonly destroy = jest.fn();
  getPeerCertificate() {
    return { subject: { CN: 'a.com' } };
  }
  getProtocol() {
    return this.protocol;
  }
}

let socket: FakeSocket;

beforeEach(() => {
  socket = new FakeSocket();
  connectMock.mockReturnValue(socket);
  publicCheck.mockResolvedValue(new URL('https://a.com'));
});

/** Lets the public-address check settle so the socket exists before it answers. */
const settle = () => new Promise((resolve) => setImmediate(resolve));

describe('reading a certificate off a TLS handshake', () => {
  it('connects with SNI, does not enforce the chain, and reports what it found', async () => {
    const pending = readCertificate('a.com', 50);
    await settle();
    socket.emit('secureConnect');
    await expect(pending).resolves.toEqual({
      certificate: { subject: { CN: 'a.com' } },
      protocol: 'TLSv1.2',
      authorized: false,
      authorizationError: 'CERT_HAS_EXPIRED',
    });
    expect(connectMock).toHaveBeenCalledWith({
      host: 'a.com',
      port: 443,
      servername: 'a.com',
      rejectUnauthorized: false,
      timeout: 50,
    });
    expect(socket.end).toHaveBeenCalled();
  });

  it('reports an empty protocol and error for a trusted handshake', async () => {
    socket.authorized = true;
    socket.authorizationError = undefined;
    socket.protocol = null;
    const pending = readCertificate('a.com', 50);
    await settle();
    socket.emit('secureConnect');
    await expect(pending).resolves.toMatchObject({
      protocol: '',
      authorized: true,
      authorizationError: '',
    });
  });

  it('gives up after the timeout', async () => {
    const pending = readCertificate('a.com', 25);
    await settle();
    socket.emit('timeout');
    await expect(pending).rejects.toThrow('No TLS handshake within 25 ms');
    expect(socket.destroy).toHaveBeenCalled();
  });

  it('passes a connection error on', async () => {
    const pending = readCertificate('a.com', 50);
    await settle();
    socket.emit('error', new Error('ECONNREFUSED'));
    await expect(pending).rejects.toThrow('ECONNREFUSED');
    expect(socket.destroy).toHaveBeenCalled();
  });

  it('never connects to a host that resolves to a private address', async () => {
    publicCheck.mockRejectedValue(new UnsafeUrlError('The host a.com is not a public address'));
    await expect(readCertificate('a.com', 50)).rejects.toThrow('not a public address');
    expect(connectMock).not.toHaveBeenCalled();
  });
});
