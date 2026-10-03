import { connect } from 'node:tls';
import { assertPublicHttpsUrl } from '../../utils/safeFetch';
import type { HandshakeResult } from './ssl.certificates';

const HTTPS_PORT = 443;

/**
 * Opens a TLS connection to the host, reads the certificate it presents and closes it.
 *
 * The chain is NOT enforced (`rejectUnauthorized: false`): a certificate that fails
 * verification is exactly what this screen exists to show, so the handshake is allowed to
 * finish and `authorized` records the verdict instead. Nothing is sent over the connection.
 * The host must resolve to public addresses only, like every other outbound check
 * (utils/safeFetch), so a monitor cannot be pointed at this server's private network.
 */
export async function readCertificate(host: string, timeoutMs: number): Promise<HandshakeResult> {
  await assertPublicHttpsUrl(`https://${host}`);
  return new Promise((resolve, reject) => {
    const socket = connect({
      host,
      port: HTTPS_PORT,
      servername: host,
      rejectUnauthorized: false,
      timeout: timeoutMs,
    });
    socket.once('secureConnect', () => {
      const result: HandshakeResult = {
        certificate: socket.getPeerCertificate(),
        protocol: socket.getProtocol() ?? '',
        authorized: socket.authorized,
        authorizationError: socket.authorizationError ? String(socket.authorizationError) : '',
      };
      socket.end();
      resolve(result);
    });
    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error(`No TLS handshake within ${timeoutMs} ms`));
    });
    socket.once('error', (error: Error) => {
      socket.destroy();
      reject(error);
    });
  });
}
