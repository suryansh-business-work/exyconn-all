import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import blockedNetworks from './blockedNetworks.json';

/**
 * Outbound HTTP to an address somebody typed in — a webhook endpoint, a status monitor.
 *
 * A plain `fetch(url)` on such an address is server-side request forgery: a URL that resolves
 * to 127.0.0.1, 10.x, 169.254.169.254 (cloud metadata) or a Docker service name reaches
 * whatever listens on this host's private network, with the server's own network position.
 * Every request here resolves the host first and refuses when ANY address it resolves to is
 * not a public unicast address; redirects are followed by hand so each hop is checked again;
 * the time and the size of the answer are both capped.
 *
 * Residual risk (DNS rebinding): the address is checked, then `fetch` resolves the name again
 * to connect. A resolver that answers public-then-private inside that gap could still reach a
 * private address. Global `fetch` offers no hook to pin the checked address; closing the gap
 * fully needs an undici Agent with a validating `connect.lookup` (or an egress proxy/firewall).
 */

/**
 * Ranges that are never a legitimate public destination, in CIDR notation, each with why.
 * Kept as data in blockedNetworks.json: this is the deny-list of the SSRF guard, not a
 * destination anybody connects to.
 */
const BLOCKED_IPV4 = blockedNetworks.ipv4.map((range) => range.cidr);
// No rule for IPv4-mapped (::ffff:a.b.c.d): BlockList already checks those against the IPv4
// rules above, and a ::ffff:0:0/96 rule would match every IPv4 address.
const BLOCKED_IPV6 = blockedNetworks.ipv6.map((range) => range.cidr);

const BLOCKED = new BlockList();
function blockSubnets(cidrs: readonly string[], family: 'ipv4' | 'ipv6'): void {
  for (const cidr of cidrs) {
    const [network, prefix] = cidr.split('/');
    BLOCKED.addSubnet(network, Number(prefix), family);
  }
}
blockSubnets(BLOCKED_IPV4, 'ipv4');
blockSubnets(BLOCKED_IPV6, 'ipv6');

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES = 1024 * 1024;
const DEFAULT_MAX_REDIRECTS = 3;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

/** A URL refused because of where it points. The message is safe to show to the person. */
export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

export interface SafeFetchOptions {
  /** Allow plain http as well as https. Off unless a caller has a reason. */
  allowHttp?: boolean;
  timeoutMs?: number;
  /** The most of the response body that is read; a longer body is an error. */
  maxBytes?: number;
  maxRedirects?: number;
}

/** Whether an IP literal is one this server may connect to. */
export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 0) {
    return false;
  }
  return !BLOCKED.check(address, family === 4 ? 'ipv4' : 'ipv6');
}

/** Parses and checks the scheme; the host is checked separately. */
function parseUrl(raw: string, allowHttp: boolean): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError('Enter a valid URL');
  }
  const schemeOk = url.protocol === 'https:' || (allowHttp && url.protocol === 'http:');
  if (!schemeOk) {
    throw new UnsafeUrlError(allowHttp ? 'Use an http or https URL' : 'Use an https URL');
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError('A URL must not carry a username or password');
  }
  return url;
}

/** Resolves the host and refuses unless every address it resolves to is public. */
async function assertPublicHost(url: URL): Promise<void> {
  const host = url.hostname.replace(/^\[(.*)\]$/, '$1');
  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new UnsafeUrlError(`The host ${host} could not be resolved`);
  }
  if (addresses.length === 0 || !addresses.every(({ address }) => isPublicAddress(address))) {
    throw new UnsafeUrlError(`The host ${host} is not a public internet address`);
  }
}

/**
 * Throws `UnsafeUrlError` unless the URL is https and its host resolves only to public
 * addresses. For validating an address when it is saved, so a bad one is refused up front.
 */
export async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  const url = parseUrl(raw, false);
  await assertPublicHost(url);
  return url;
}

/** Reads at most `maxBytes` of the body, erroring (and cancelling) past that. */
async function readCapped(response: Response, maxBytes: number): Promise<Uint8Array<ArrayBuffer>> {
  const reader = response.body?.getReader();
  if (!reader) {
    return new Uint8Array();
  }
  const chunks: Uint8Array[] = [];
  await readChunks(reader, chunks, 0, maxBytes);
  return Buffer.concat(chunks);
}

/** Reads the stream chunk by chunk into `chunks`; each read must follow the one before. */
async function readChunks(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  chunks: Uint8Array[],
  total: number,
  maxBytes: number,
): Promise<void> {
  const { done, value } = await reader.read();
  if (done) {
    return;
  }
  const read = total + value.byteLength;
  if (read > maxBytes) {
    await reader.cancel();
    throw new UnsafeUrlError(`The response was larger than ${maxBytes} bytes`);
  }
  chunks.push(value);
  return readChunks(reader, chunks, read, maxBytes);
}

/** The request the next hop makes: 303 (and 301/302 after a POST) turns into a bodiless GET. */
function redirectInit(status: number, init: RequestInit): RequestInit {
  const method = (init.method ?? 'GET').toUpperCase();
  if (status === 303 || ((status === 301 || status === 302) && method === 'POST')) {
    return { ...init, method: 'GET', body: undefined };
  }
  return init;
}

/**
 * `fetch`, restricted to public destinations. Throws `UnsafeUrlError` for a refused address,
 * too many redirects or an oversized body, and the usual fetch errors (incl. the timeout's
 * abort) otherwise. The returned Response's body has already been read within the cap.
 */
export function safeFetch(
  raw: string,
  init: RequestInit = {},
  options: SafeFetchOptions = {},
): Promise<Response> {
  const allowHttp = options.allowHttp ?? false;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const signal = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  const limits = {
    allowHttp,
    maxRedirects,
    maxBytes: options.maxBytes ?? DEFAULT_MAX_BYTES,
    signal,
  };
  // Parsed inside the chain so a refused URL rejects the returned promise rather than throwing.
  return Promise.resolve().then(() => fetchHop(parseUrl(raw, allowHttp), init, 0, limits));
}

interface HopLimits {
  allowHttp: boolean;
  maxRedirects: number;
  maxBytes: number;
  signal: AbortSignal;
}

/** One hop: checks and requests `url`, then follows a redirect as the next hop, by hand. */
async function fetchHop(
  url: URL,
  request: RequestInit,
  hop: number,
  limits: HopLimits,
): Promise<Response> {
  await assertPublicHost(url);
  const response = await fetch(url.toString(), {
    ...request,
    redirect: 'manual',
    signal: limits.signal,
  });
  const location = response.headers.get('location');

  if (!REDIRECT_STATUSES.has(response.status) || !location) {
    const body = await readCapped(response, limits.maxBytes);
    return new Response(NULL_BODY_STATUSES.has(response.status) ? null : body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  await response.body?.cancel();
  if (hop >= limits.maxRedirects) {
    throw new UnsafeUrlError(`More than ${limits.maxRedirects} redirects`);
  }
  const next = parseUrl(new URL(location, url).toString(), limits.allowHttp);
  return fetchHop(next, redirectInit(response.status, request), hop + 1, limits);
}
