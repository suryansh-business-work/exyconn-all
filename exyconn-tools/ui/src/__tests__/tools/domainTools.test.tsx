import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { apiOk, findAlert, jsonReply, renderTool, stubFetch, submitSingleField } from '../helpers/toolHarness';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../helpers/toolHarness')).toolLayoutStub()
);

import { DomainResultDisplay, KeyValueTable } from '../../shared/components/DomainToolShared';
import BlacklistCheck from '../../tools/blacklist-check';
import DnsLookup from '../../tools/dns-lookup';
import CnameChecker from '../../tools/cname-checker';
import DomainAgeChecker from '../../tools/domain-age-checker';
import DomainAvailability from '../../tools/domain-availability';
import DomainExpiryChecker from '../../tools/domain-expiry-checker';
import HttpHeadersCheck from '../../tools/http-headers-check';
import IpLookup from '../../tools/ip-lookup';
import MxRecordChecker from '../../tools/mx-record-checker';
import NameserverChecker from '../../tools/nameserver-checker';
import OpenPortsCheck from '../../tools/open-ports-check';
import PageSpeedChecker from '../../tools/page-speed-checker';
import RedirectChecker from '../../tools/redirect-checker';
import ReverseIpLookup from '../../tools/reverse-ip-lookup';
import SslChecker from '../../tools/ssl-checker';
import SslExpiryMonitor from '../../tools/ssl-expiry-monitor';
import SubdomainFinder from '../../tools/subdomain-finder';
import TxtRecordChecker from '../../tools/txt-record-checker';
import WebsiteStatusChecker from '../../tools/website-status-checker';
import WhoisLookup from '../../tools/whois-lookup';

interface Case {
  name: string;
  Tool: React.ComponentType;
  /** What the visitor types. */
  input: string;
  /** Each variant is one successful answer; the texts must all be on the page for it. */
  variants: Array<{ data: Record<string, unknown>; shows: Array<string | RegExp> }>;
  /** The request body the tool posts for `input`. */
  body: Record<string, unknown>;
  /** The message when the API answers `{ success: false }` with no error text. */
  fallback: string;
}

const CASES: Case[] = [
  {
    name: 'blacklist-check',
    Tool: BlacklistCheck,
    input: 'example.org',
    body: { domain: 'example.org' },
    fallback: 'Check failed',
    variants: [
      {
        data: {
          domain: 'example.org',
          ip: '1.2.3.4',
          isClean: true,
          listedCount: 0,
          totalChecked: 2,
          results: [
            { blacklist: 'zen.spamhaus.org', listed: false },
            { blacklist: 'bl.spamcop.net', listed: false },
          ],
        },
        shows: ['CLEAN', '0/2 blacklists', 'IP: 1.2.3.4', 'zen.spamhaus.org'],
      },
      {
        data: {
          domain: 'bad.test',
          ip: '5.6.7.8',
          isClean: false,
          listedCount: 1,
          totalChecked: 1,
          results: [{ blacklist: 'zen.spamhaus.org', listed: true }],
        },
        shows: ['LISTED', 'Listed'],
      },
      {
        data: { domain: 'none.test', ip: '9.9.9.9', isClean: true, listedCount: 0, totalChecked: 0 },
        shows: ['CLEAN'],
      },
    ],
  },
  {
    name: 'cname-checker',
    Tool: CnameChecker,
    input: 'www.example.org',
    body: { domain: 'www.example.org' },
    fallback: 'Check failed',
    variants: [
      {
        data: { domain: 'www.example.org', hasCNAME: true, records: ['target.example.net'] },
        shows: ['CNAME Found', 'target.example.net'],
      },
      {
        data: { domain: 'example.org', hasCNAME: false, records: [], message: 'No CNAME records found' },
        shows: ['No CNAME', 'No CNAME records found'],
      },
    ],
  },
  {
    name: 'domain-age-checker',
    Tool: DomainAgeChecker,
    input: 'example.org',
    body: { domain: 'example.org' },
    fallback: 'Check failed',
    variants: [
      {
        data: {
          domain: 'example.org',
          registrationDate: '2016-04-01T00:00:00Z',
          age: { years: 10, months: 6, days: 8 },
          ageString: '10 years, 6 months, 8 days',
          totalDays: 3844,
        },
        shows: ['years old', '10 years, 6 months, 8 days', '3844 total days'],
      },
      {
        data: { domain: 'new.test', age: null, registrationDate: null, message: 'Registration date not found' },
        shows: ['Registration date not found'],
      },
    ],
  },
  {
    name: 'domain-availability',
    Tool: DomainAvailability,
    input: 'example.org',
    body: { domain: 'example.org' },
    fallback: 'Check failed',
    variants: [
      {
        data: { domain: 'example.org', available: false, ips: ['1.1.1.1'], message: 'Domain is registered' },
        shows: ['Taken', 'Resolves to:', '1.1.1.1'],
      },
      {
        data: { domain: 'free.test', available: true, ips: [], message: 'Domain might be available' },
        shows: ['Available!'],
      },
    ],
  },
  {
    name: 'domain-expiry-checker',
    Tool: DomainExpiryChecker,
    input: 'example.org',
    body: { domain: 'example.org' },
    fallback: 'Check failed',
    variants: [
      {
        data: { domain: 'example.org', daysUntilExpiry: 200, expiryDate: '2027-04-01', registrationDate: '2016-04-01' },
        shows: ['days until expiry', '200'],
      },
      { data: { domain: 'soon.test', daysUntilExpiry: 45, expiryDate: '2026-11-25' }, shows: ['45'] },
      { data: { domain: 'critical.test', daysUntilExpiry: 5, expiryDate: '2026-10-15' }, shows: ['5'] },
      { data: { domain: 'unknown.test', daysUntilExpiry: null, expiryDate: null }, shows: ['N/A'] },
    ],
  },
  {
    name: 'http-headers-check',
    Tool: HttpHeadersCheck,
    input: 'https://example.org',
    body: { url: 'https://example.org' },
    fallback: 'Check failed',
    variants: [
      {
        data: {
          statusCode: 200,
          server: 'nginx',
          securityHeaders: { 'Strict-Transport-Security': 'max-age=1', 'X-Frame-Options': 'Not set' },
          headers: { 'content-type': 'text/html', 'content-length': 12 },
        },
        shows: ['Status: 200', 'Server: nginx', 'Missing', 'Set', 'text/html'],
      },
      {
        data: { statusCode: 500, server: 'Unknown', securityHeaders: {}, headers: {} },
        shows: ['Status: 500'],
      },
    ],
  },
  {
    name: 'ip-lookup',
    Tool: IpLookup,
    input: '8.8.8.8',
    body: { ip: '8.8.8.8' },
    fallback: 'IP lookup failed',
    variants: [
      {
        data: { query: '8.8.8.8', country: 'United States', isp: 'Google LLC' },
        shows: ['United States', 'Google LLC'],
      },
    ],
  },
  {
    name: 'mx-record-checker',
    Tool: MxRecordChecker,
    input: 'example.org',
    body: { domain: 'example.org' },
    fallback: 'MX record check failed',
    variants: [
      {
        data: {
          domain: 'example.org',
          records: [
            { priority: 10, exchange: 'mx1.example.org' },
            { priority: 20, exchange: 'mx2.example.org' },
          ],
        },
        shows: ['mx1.example.org', 'mx2.example.org'],
      },
    ],
  },
  {
    name: 'nameserver-checker',
    Tool: NameserverChecker,
    input: 'example.org',
    body: { domain: 'example.org' },
    fallback: 'Check failed',
    variants: [
      {
        data: {
          domain: 'example.org',
          nameservers: [
            { nameserver: 'ns1.example.org', ips: ['10.0.0.1', '10.0.0.2'] },
            { nameserver: 'ns2.example.org', ips: [] },
          ],
        },
        shows: ['ns1.example.org', '10.0.0.1', 'ns2.example.org'],
      },
    ],
  },
  {
    name: 'open-ports-check',
    Tool: OpenPortsCheck,
    input: 'example.org',
    body: { host: 'example.org' },
    fallback: 'Check failed',
    variants: [
      {
        data: {
          host: 'example.org',
          openCount: 1,
          totalChecked: 3,
          results: [
            { port: 22, service: 'SSH', status: 'open' },
            { port: 80, service: 'HTTP', status: 'filtered' },
            { port: 25, service: 'SMTP', status: 'closed' },
          ],
        },
        shows: ['1 open', '3 scanned', 'SSH', 'open', 'filtered', 'closed'],
      },
    ],
  },
  {
    name: 'page-speed-checker',
    Tool: PageSpeedChecker,
    input: 'example.org',
    body: { url: 'https://example.org' },
    fallback: 'Check failed',
    variants: [
      {
        data: {
          loadTime: 500,
          pageSizeFormatted: '12.00 KB',
          performance: { rating: 'Fast' },
          resources: { scripts: 3, stylesheets: 1, images: 2, inlineStyles: 0 },
        },
        shows: ['500ms', 'Page Size: 12.00 KB', 'Resource Count'],
      },
      { data: { loadTime: 1500, pageSizeFormatted: '1 KB', performance: { rating: 'Average' } }, shows: ['1500ms'] },
      { data: { loadTime: 4000, pageSizeFormatted: '1 KB', performance: { rating: 'Slow' } }, shows: ['4000ms'] },
    ],
  },
  {
    name: 'redirect-checker',
    Tool: RedirectChecker,
    input: 'http://example.org',
    body: { url: 'http://example.org' },
    fallback: 'Check failed',
    variants: [
      {
        data: {
          hasRedirects: true,
          totalRedirects: 2,
          chain: [
            { url: 'http://example.org', statusCode: 301, location: 'https://example.org' },
            { url: 'https://example.org', statusCode: 200, location: '' },
            { url: 'https://example.org/err', statusCode: 0, location: 'blocked' },
          ],
        },
        shows: ['2 redirect(s)', '301', '200', 'Error'],
      },
      {
        data: {
          hasRedirects: false,
          totalRedirects: 0,
          chain: [{ url: 'https://example.org', statusCode: 404, location: '' }],
        },
        shows: ['No redirects', '404'],
      },
    ],
  },
  {
    name: 'reverse-ip-lookup',
    Tool: ReverseIpLookup,
    input: '8.8.8.8',
    body: { ip: '8.8.8.8' },
    fallback: 'Reverse IP lookup failed',
    variants: [
      { data: { ip: '8.8.8.8', count: 1, hostnames: ['dns.google'] }, shows: ['1 hostname(s) found', 'dns.google'] },
      {
        data: { ip: '1.1.1.1', count: 0, hostnames: [], message: 'No reverse DNS records found' },
        shows: ['No reverse DNS records found'],
      },
    ],
  },
  {
    name: 'ssl-checker',
    Tool: SslChecker,
    input: 'example.org',
    body: { domain: 'example.org' },
    fallback: 'SSL check failed',
    variants: [
      {
        data: {
          valid: true,
          daysRemaining: 90,
          subject: { CN: 'example.org' },
          issuer: { O: 'Acme CA' },
          protocol: 'TLSv1.3',
        },
        shows: ['Valid', '90 days remaining', 'Subject', 'Issuer', 'example.org', 'Acme CA'],
      },
      { data: { valid: false, daysRemaining: 15, protocol: 'TLSv1.2' }, shows: ['Invalid', '15 days remaining'] },
      { data: { valid: false, daysRemaining: 2 }, shows: ['2 days remaining'] },
    ],
  },
  {
    name: 'ssl-expiry-monitor',
    Tool: SslExpiryMonitor,
    input: 'example.org',
    body: { domain: 'example.org' },
    fallback: 'Check failed',
    variants: [
      {
        data: { domain: 'example.org', status: 'valid', daysRemaining: 90, validFrom: 'a', validTo: 'b' },
        shows: ['VALID'],
      },
      {
        data: { domain: 'example.org', status: 'warning', daysRemaining: 20, validFrom: 'a', validTo: 'b' },
        shows: ['WARNING'],
      },
      {
        data: { domain: 'example.org', status: 'expired', daysRemaining: -1, validFrom: 'a', validTo: 'b' },
        shows: ['EXPIRED'],
      },
    ],
  },
  {
    name: 'subdomain-finder',
    Tool: SubdomainFinder,
    input: 'example.org',
    body: { domain: 'example.org' },
    fallback: 'Search failed',
    variants: [
      {
        data: {
          domain: 'example.org',
          totalFound: 1,
          totalChecked: 45,
          subdomains: [{ subdomain: 'www.example.org', ips: ['9.9.9.9'] }],
        },
        shows: ['1 found', '45 checked', 'www.example.org', '9.9.9.9'],
      },
    ],
  },
  {
    name: 'txt-record-checker',
    Tool: TxtRecordChecker,
    input: 'example.org',
    body: { domain: 'example.org' },
    fallback: 'Check failed',
    variants: [
      {
        data: {
          domain: 'example.org',
          spf: ['v=spf1 -all'],
          dkim: [{ selector: 'google', record: ['v=DKIM1'] }],
          dmarc: ['v=DMARC1; p=none'],
          txtRecords: ['v=spf1 -all', 'other'],
        },
        shows: ['SPF', 'v=spf1 -all', 'DKIM', 'google', 'DMARC', 'v=DMARC1; p=none', '2 total record(s)'],
      },
      { data: { domain: 'bare.test', spf: [], dkim: [], dmarc: [], txtRecords: [] }, shows: ['0 total record(s)'] },
    ],
  },
  {
    name: 'website-status-checker',
    Tool: WebsiteStatusChecker,
    input: 'example.org',
    body: { url: 'https://example.org' },
    fallback: 'Check failed',
    variants: [
      {
        data: {
          url: 'https://example.org',
          isUp: true,
          statusCode: 200,
          statusText: 'OK',
          responseTime: 120,
          server: 'nginx',
          contentType: 'text/html',
        },
        shows: ['UP', '200 OK', 'Response Time: 120ms'],
      },
      {
        data: {
          url: 'https://example.org',
          isUp: false,
          statusCode: 0,
          statusText: 'Connection Failed',
          responseTime: 30,
        },
        shows: ['DOWN', '0 Connection Failed'],
      },
    ],
  },
  {
    name: 'whois-lookup',
    Tool: WhoisLookup,
    input: 'example.org',
    body: { domain: 'example.org' },
    fallback: 'Whois lookup failed',
    variants: [
      {
        data: {
          domain: 'example.org',
          registrar: 'Big Registrar',
          registrant: 'Ada',
          status: ['active'],
          nameservers: ['ns1.example.org'],
          events: [{ eventAction: 'registration', eventDate: '2016-04-01T00:00:00Z' }],
        },
        shows: ['Big Registrar', 'Ada', 'active', 'ns1.example.org', 'registration'],
      },
      { data: { domain: 'tcp.test', registrar: 'Unknown', registrant: 'Private', status: [] }, shows: ['Unknown'] },
    ],
  },
];

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe.each(CASES)('$name', ({ Tool, input, body, variants, fallback }) => {
  it('posts what was typed and shows each kind of answer', async () => {
    for (const variant of variants) {
      const fetchMock = stubFetch(apiOk(variant.data));
      const { container, unmount } = renderTool(Tool);

      submitSingleField(container, input);

      for (const text of variant.shows) {
        expect((await screen.findAllByText(text, { exact: false })).length).toBeGreaterThan(0);
      }
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe('POST');
      expect(JSON.parse(String(init.body))).toEqual(body);
      unmount();
    }
  });

  it('shows the API error, or its own message when the API gives none', async () => {
    stubFetch(jsonReply({ success: false, error: 'Lookup refused' }));
    const first = renderTool(Tool);
    submitSingleField(first.container, input);
    expect(await findAlert('Lookup refused')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Lookup refused')).not.toBeInTheDocument());
    first.unmount();

    stubFetch(jsonReply({ success: false, error: 'Dismissed by clicking away' }));
    const away = renderTool(Tool);
    submitSingleField(away.container, input);
    expect(await findAlert('Dismissed by clicking away')).toBeInTheDocument();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      fireEvent.click(document.body);
    });
    await waitFor(() => expect(screen.queryByText('Dismissed by clicking away')).not.toBeInTheDocument());
    away.unmount();

    stubFetch(jsonReply({ success: false }));
    const second = renderTool(Tool);
    submitSingleField(second.container, input);
    expect(await findAlert(fallback)).toBeInTheDocument();
    second.unmount();
  });

  it('locks the form while the request is running', async () => {
    let finish: (value: unknown) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      )
    );
    const { container } = renderTool(Tool);

    submitSingleField(container, input);

    await waitFor(() => {
      const submit = container.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submit).toBeDisabled();
    });
    await act(async () => finish(jsonReply({ success: false })));
  });

  it('shows its own message when the request itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    const { container } = renderTool(Tool);

    submitSingleField(container, input);

    expect(await findAlert(fallback)).toBeInTheDocument();
  });
});

describe('URL tools', () => {
  it.each([
    ['page-speed-checker', PageSpeedChecker, 'https://example.org/a'],
    ['redirect-checker', RedirectChecker, 'https://example.org/a'],
    ['website-status-checker', WebsiteStatusChecker, 'http://example.org/a'],
    ['http-headers-check', HttpHeadersCheck, 'example.org'],
  ])('%s posts a URL that already has a protocol as it is, and adds https otherwise', async (_id, Tool, typed) => {
    for (const value of [typed, typed.startsWith('http') ? 'example.org/a' : 'http://example.org/a']) {
      const fetchMock = stubFetch(apiOk({}));
      const { container, unmount } = renderTool(Tool);

      submitSingleField(container, value);

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      const { url } = JSON.parse(String(init.body)) as { url: string };
      expect(url).toBe(value.startsWith('http') ? value : `https://${value}`);
      unmount();
    }
  });
});

describe('dns-lookup', () => {
  it('posts the domain with the record type chosen and lists every record set', async () => {
    const fetchMock = stubFetch(
      apiOk({ domain: 'example.org', A: ['1.1.1.1', '2.2.2.2'], SOA: { nsname: 'ns1' }, MX: [] })
    );
    const { container } = renderTool(DnsLookup);

    fireEvent.change(screen.getByLabelText('Domain'), { target: { value: 'example.org' } });
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: 'MX' }));
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(await screen.findByText('2 record(s)')).toBeInTheDocument();
    expect(screen.getByText('1 record')).toBeInTheDocument();
    expect(screen.getByText('0 record(s)')).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ domain: 'example.org', type: 'MX' });
  });

  it('locks the button while looking up', async () => {
    let finish: (value: unknown) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      )
    );
    const { container } = renderTool(DnsLookup);
    fireEvent.change(screen.getByLabelText('Domain'), { target: { value: 'example.org' } });

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(await screen.findByRole('button', { name: 'Looking up...' })).toBeDisabled();
    await act(async () => finish(jsonReply({ success: false })));
  });

  it('asks for a domain, and reports failures', async () => {
    const fetchMock = stubFetch(jsonReply({ success: false }));
    const { container } = renderTool(DnsLookup);

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(await screen.findByText('Domain is required')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Domain'), { target: { value: 'example.org' } });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(await findAlert('DNS lookup failed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('DNS lookup failed')).not.toBeInTheDocument());
  });

  it('reports a request that fails outright, and a refusal with its own text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    const { container } = renderTool(DnsLookup);
    fireEvent.change(screen.getByLabelText('Domain'), { target: { value: 'example.org' } });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(await findAlert('DNS lookup failed')).toBeInTheDocument();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      fireEvent.click(document.body);
    });
    await waitFor(() => expect(screen.queryByText('DNS lookup failed')).not.toBeInTheDocument());

    stubFetch(jsonReply({ success: false, error: 'Blocked address' }));
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(await findAlert('Blocked address')).toBeInTheDocument();
  });
});

describe('DomainResultDisplay', () => {
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
  });

  it('renders nothing without data', () => {
    const { container } = renderTool(() => <DomainResultDisplay title="Nothing" data={null} />);

    expect(container.querySelector('h6')).toBeNull();
  });

  it('copies the result as JSON and confirms it, then goes back to the copy label', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderTool(() => (
      <DomainResultDisplay title="Result" data={{ a: 1 }}>
        x
      </DomainResultDisplay>
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }));

    expect(writeText).toHaveBeenCalledWith(JSON.stringify({ a: 1 }, null, 2));
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('downloads the result under a name made from its title', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    let download = '';
    const create = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const element = create(tag);
      if (tag === 'a') {
        Object.defineProperty(element, 'download', {
          set: (value: string) => {
            download = value;
          },
          get: () => download,
        });
      }
      return element;
    });
    renderTool(() => (
      <DomainResultDisplay title="DNS Records For example.org" data={{ a: 1 }}>
        x
      </DomainResultDisplay>
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));

    expect(click).toHaveBeenCalledTimes(1);
    expect(download).toBe('dns-records-for-example.org-result.json');
  });

  it('shows booleans as chips, objects as JSON and other values as text in the key-value table', () => {
    renderTool(() => (
      <KeyValueTable
        data={{ isValid: true, hasIssues: false, nested: { a: 1 }, name: 'x', skipped: 'no' }}
        excludeKeys={['skipped']}
      />
    ));

    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText(/"a": 1/)).toBeInTheDocument();
    expect(screen.getByText('x')).toBeInTheDocument();
    expect(screen.queryByText('no')).not.toBeInTheDocument();
    expect(screen.getByText('is Valid')).toBeInTheDocument();
  });
});

describe('domain input form', () => {
  it('keeps the button disabled until something is typed', () => {
    renderTool(BlacklistCheck);

    expect(screen.getByRole('button', { name: 'Check Blacklists' })).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'example.org' } });
    expect(screen.getByRole('button', { name: 'Check Blacklists' })).toBeEnabled();
  });

  it('asks for a domain of at least three characters before checking', async () => {
    const fetchMock = stubFetch();
    const { container } = renderTool(BlacklistCheck);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ab' } });
    fireEvent.blur(screen.getByRole('textbox'));
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(await screen.findByText('Enter a valid domain')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
