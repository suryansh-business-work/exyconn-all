import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import {
  contactPages,
  emailsInHtml,
  findEmails,
  findWebsiteEmails,
} from '../../../../src/modules/google-maps/website-emails';
import { robotsAllows } from '../../../../src/modules/google-maps/robots';
import { UnsafeUrlError } from '../../../../src/utils/safeFetch';
import ips from '../../../fixtures/ips.json';

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));
/** Names resolve to `address`; an IP literal resolves to itself, as the real resolver does. */
const resolveTo = (address: string) =>
  (lookup as unknown as jest.Mock).mockImplementation(async (host: string) => {
    const literal = host.replace(/^\[(.*)\]$/, '$1');
    const family = isIP(literal);
    return family === 0 ? [{ address, family: 4 }] : [{ address: literal, family }];
  });

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

/** A site whose pages are keyed by path; anything else is a 404. */
const site = (pages: Record<string, string>) =>
  jest.fn(async (url: string) => {
    const body = pages[new URL(url).pathname];
    return body === undefined ? new Response('', { status: 404 }) : new Response(body);
  });

describe('email extraction', () => {
  it('finds addresses in text and mailto links, lower-cased and de-duplicated', () => {
    const html =
      '<a href="mailto:Sales@Acme.example">Mail</a> or write to sales@acme.example. ' +
      'Support: help&#64;acme.example';
    expect(emailsInHtml(html)).toEqual(['sales@acme.example', 'help@acme.example']);
  });

  it('ignores asset names and placeholder domains', () => {
    expect(emailsInHtml('logo@2x.png you@example.com real@shop.example')).toEqual([
      'real@shop.example',
    ]);
  });

  it('scans a long run of address characters in linear time', () => {
    const text = `${'a'.repeat(50_000)}@${'b'.repeat(50_000)}`;
    const started = Date.now();
    expect(findEmails(text)).toEqual([]);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('follows only same-site contact and about links', () => {
    const base = new URL('https://acme.example/');
    const html =
      '<a href="/contact-us">Contact</a><a href="https://other.example/contact">x</a>' +
      '<a href="/about">About</a><a href="/blog">Blog</a><a href="/kontakt">K</a>';
    expect(contactPages(html, base).map((url) => url.pathname)).toEqual(['/contact-us', '/about']);
  });
});

describe('robotsAllows', () => {
  const robots = [
    'User-agent: *',
    'Disallow: /private',
    'Allow: /private/contact',
    '',
    'User-agent: ExyconnLeadBot',
    'Disallow: /',
  ].join('\n');

  it('uses the group for our agent when there is one', () => {
    expect(robotsAllows(robots, 'ExyconnLeadBot', '/contact')).toBe(false);
  });

  it('falls back to *, where the longest matching rule wins', () => {
    expect(robotsAllows(robots, 'OtherBot', '/private/page')).toBe(false);
    expect(robotsAllows(robots, 'OtherBot', '/private/contact')).toBe(true);
    expect(robotsAllows(robots, 'OtherBot', '/public')).toBe(true);
  });

  it('allows everything when there is no robots.txt', () => {
    expect(robotsAllows('', 'ExyconnLeadBot', '/')).toBe(true);
  });
});

describe('findWebsiteEmails', () => {
  it('reads the home page and its contact page', async () => {
    resolveTo(ips.ip93_184_215_14);
    globalThis.fetch = site({
      '/': '<a href="/contact">Contact</a> hello@acme.example',
      '/contact': 'sales@acme.example',
    }) as unknown as typeof fetch;

    await expect(findWebsiteEmails('https://acme.example/')).resolves.toEqual({
      status: 'FOUND',
      message: '',
      emails: ['hello@acme.example', 'sales@acme.example'],
    });
  });

  it('stays out when robots.txt disallows the page', async () => {
    resolveTo(ips.ip93_184_215_14);
    const fetchMock = site({ '/robots.txt': 'User-agent: *\nDisallow: /', '/': 'a@acme.example' });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await findWebsiteEmails('https://acme.example/');

    expect(result.status).toBe('BLOCKED');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('says so when the site publishes no address, or does not answer', async () => {
    resolveTo(ips.ip93_184_215_14);
    globalThis.fetch = site({ '/': '<p>Call us</p>' }) as unknown as typeof fetch;
    await expect(findWebsiteEmails('http://acme.example')).resolves.toMatchObject({
      status: 'NONE',
    });

    globalThis.fetch = site({}) as unknown as typeof fetch;
    await expect(findWebsiteEmails('https://acme.example')).resolves.toMatchObject({
      status: 'UNREACHABLE',
    });
  });

  it.each([
    ['a loopback literal', `http://[${ips.ip__ffff_127_0_0_1}]/`, ips.ip93_184_215_14],
    ['a host resolving to a private address', 'https://intranet.acme.example/', ips.ip10_0_0_1],
    ['cloud metadata', 'http://metadata.example/', ips.ip169_254_169_254],
  ])('refuses %s without connecting (SSRF)', async (_name, url, address) => {
    resolveTo(address);
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock;

    await expect(findWebsiteEmails(url)).rejects.toBeInstanceOf(UnsafeUrlError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses schemes other than http(s) and URLs with credentials', async () => {
    await expect(findWebsiteEmails('file:///etc/passwd')).rejects.toThrow(/http and https/);
    await expect(findWebsiteEmails('https://u:p@acme.example')).rejects.toThrow(/password/);
    await expect(findWebsiteEmails('not a url')).rejects.toThrow(/valid website/);
  });
});
