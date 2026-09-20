import express from 'express';
import request from 'supertest';
import { lookup } from 'node:dns/promises';
import { CampaignModel } from '../../src/modules/marketing/marketing.model';
import { CampaignSendModel } from '../../src/modules/marketing/campaign-send.model';
import { marketingTrackingRouter } from '../../src/modules/marketing/marketing.tracking.routes';
import {
  TRACKING_PATH,
  hashTrackingToken,
  rewriteLinks,
  signLink,
  verifyLinkSignature,
} from '../../src/modules/marketing/marketing.tracking';
import {
  UnsafeUrlError,
  assertPublicHttpsUrl,
  isPublicAddress,
  safeFetch,
} from '../../src/utils/safeFetch';
import {
  AVATAR_UPLOAD,
  MEDIA_UPLOAD,
  assertUpload,
  screenshotUpload,
} from '../../src/utils/uploadValidation';
import { publicServiceError, publicServiceUrl } from '../../src/modules/status/status.service';
import {
  escapeHtml,
  rawHtml,
  renderTemplate,
  substitute,
} from '../../src/modules/email/email.render';
import { customTemplate } from '../../src/templates/custom.template';

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));
const resolveTo = (...addresses: string[]) =>
  (lookup as unknown as jest.Mock).mockResolvedValue(
    addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 })),
  );

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('click link signing (open redirect)', () => {
  const ORIGIN = 'https://portal.example.com';

  it('signs every rewritten link, and the signature verifies only for that token and target', () => {
    const out = rewriteLinks('<a href="https://example.com/a">a</a>', ORIGIN, 'tok');
    const href = /href="([^"]+)"/.exec(out)?.[1] ?? '';
    const url = new URL(href);

    const signature = url.searchParams.get('s') ?? '';
    expect(signature).toHaveLength(32);
    expect(verifyLinkSignature('tok', 'https://example.com/a', signature)).toBe(true);
    expect(verifyLinkSignature('tok', 'https://evil.example/a', signature)).toBe(false);
    expect(verifyLinkSignature('other', 'https://example.com/a', signature)).toBe(false);
    expect(verifyLinkSignature('tok', 'https://example.com/a', 'short')).toBe(false);
  });

  describe('the redirect route', () => {
    const app = express().use(TRACKING_PATH, marketingTrackingRouter());

    it('follows a signed link', async () => {
      const target = 'https://example.com/p?a=1&b=2';
      const res = await request(app)
        .get(`/m/c/tok`)
        .query({ u: target, s: signLink('tok', target) });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(target);
    });

    it('refuses a forged or tampered link', async () => {
      const signature = signLink('tok', 'https://example.com');
      const forged = await request(app)
        .get('/m/c/tok')
        .query({ u: 'https://evil.example', s: signature });
      const unsigned = await request(app).get('/m/c/tok').query({ u: 'https://evil.example' });

      expect(forged.status).toBe(400);
      expect(unsigned.status).toBe(400);
    });

    it('still follows an unsigned link from an email sent before signing, when the campaign holds it', async () => {
      const campaign = await CampaignModel.create({
        name: 'Old',
        channel: 'EMAIL',
        budget: 0,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
        body: '<a href="https://example.com/offer">Offer</a>',
      });
      await CampaignSendModel.create({
        campaignId: String(campaign._id),
        audienceListId: 'list',
        to: 'a@example.com',
        status: 'SENT',
        trackingTokenHash: hashTrackingToken('legacy'),
      });

      const kept = await request(app).get('/m/c/legacy').query({ u: 'https://example.com/offer' });
      const other = await request(app).get('/m/c/legacy').query({ u: 'https://evil.example' });

      expect(kept.status).toBe(302);
      expect(other.status).toBe(400);
    });
  });
});

describe('safeFetch (SSRF)', () => {
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.17.0.2',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '::1',
    '::',
    'fd00::1',
    'fe80::1',
    '::ffff:127.0.0.1',
    '::ffff:a9fe:a9fe',
  ])('treats %s as private', (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it.each(['93.184.215.14', '8.8.8.8', '2606:4700:4700::1111'])(
    'treats %s as public',
    (address) => {
      expect(isPublicAddress(address)).toBe(true);
    },
  );

  it('refuses a host that resolves to a private address, without connecting', async () => {
    resolveTo('93.184.215.14', '10.0.0.5');
    globalThis.fetch = jest.fn() as unknown as typeof fetch;

    await expect(safeFetch('https://sneaky.example')).rejects.toThrow(UnsafeUrlError);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('refuses plain http unless allowed, and URLs with credentials', async () => {
    resolveTo('93.184.215.14');
    await expect(assertPublicHttpsUrl('http://example.com')).rejects.toThrow(/https/);
    await expect(assertPublicHttpsUrl('https://u:p@example.com')).rejects.toThrow(/password/);
    await expect(assertPublicHttpsUrl('https://example.com/hook')).resolves.toBeInstanceOf(URL);
  });

  it('re-checks every redirect hop', async () => {
    (lookup as unknown as jest.Mock).mockImplementation(async (host: string) =>
      host === 'internal.example'
        ? [{ address: '127.0.0.1', family: 4 }]
        : [{ address: '93.184.215.14', family: 4 }],
    );
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'https://internal.example/admin' },
      }),
    ) as unknown as typeof fetch;

    await expect(safeFetch('https://public.example')).rejects.toThrow(/not a public/);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('caps redirects and the size of the answer', async () => {
    resolveTo('93.184.215.14');
    globalThis.fetch = jest
      .fn()
      .mockImplementation(
        async () => new Response(null, { status: 301, headers: { location: '/again' } }),
      ) as unknown as typeof fetch;
    await expect(safeFetch('https://loop.example', {}, { maxRedirects: 2 })).rejects.toThrow(
      /redirects/,
    );

    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(new Response('x'.repeat(100))) as unknown as typeof fetch;
    await expect(safeFetch('https://big.example', {}, { maxBytes: 10 })).rejects.toThrow(/larger/);
  });

  it('turns a POST into a bodiless GET across a 303', async () => {
    resolveTo('93.184.215.14');
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 303, headers: { location: '/done' } }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const response = await safeFetch('https://a.example/hook', { method: 'POST', body: '{}' });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
    expect(fetchMock.mock.calls[1][0]).toBe('https://a.example/done');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'GET', body: undefined });
  });
});

describe('status overview for anonymous callers', () => {
  it('shows only the https origin of a monitor', () => {
    expect(publicServiceUrl('https://crm.exyconn.com/health?token=abc')).toBe(
      'https://crm.exyconn.com',
    );
    expect(publicServiceUrl('http://10.0.0.1:4004/health')).toBe('');
    expect(publicServiceUrl('not a url')).toBe('');
  });

  it('keeps an HTTP status but hides resolver and socket detail', () => {
    expect(publicServiceError('HTTP 502')).toBe('HTTP 502');
    expect(publicServiceError('')).toBe('');
    expect(publicServiceError('getaddrinfo ENOTFOUND internal.svc')).toBe('Unreachable');
  });
});

describe('upload validation', () => {
  const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
  const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16]);
  const PDF = Buffer.from('%PDF-1.7\n');
  const SVG = Buffer.from('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  const dataUrl = (mime: string, bytes: Buffer) =>
    `data:${mime};base64,${bytes.toString('base64')}`;

  it('accepts a data URL whose bytes match its type', () => {
    expect(assertUpload(dataUrl('image/png', PNG), MEDIA_UPLOAD)).toBe('png');
    expect(assertUpload(dataUrl('application/pdf', PDF), MEDIA_UPLOAD)).toBe('pdf');
    expect(assertUpload(dataUrl('image/svg+xml', SVG), MEDIA_UPLOAD)).toBe('svg');
  });

  it('accepts bare base64, recognised by its bytes', () => {
    expect(assertUpload(JPEG.toString('base64'), screenshotUpload(1024))).toBe('jpeg');
  });

  it('refuses a link, a mismatched type, a type the caller does not allow and an oversized file', () => {
    expect(() => assertUpload('https://169.254.169.254/latest', MEDIA_UPLOAD)).toThrow(
      /not a link/,
    );
    expect(() => assertUpload(dataUrl('image/png', PDF), MEDIA_UPLOAD)).toThrow(
      /cannot be uploaded/,
    );
    expect(() => assertUpload(dataUrl('text/html', Buffer.from('<p>')), MEDIA_UPLOAD)).toThrow(
      /cannot be uploaded/,
    );
    expect(() => assertUpload(dataUrl('image/svg+xml', SVG), AVATAR_UPLOAD)).toThrow(
      /cannot be uploaded/,
    );
    expect(() => assertUpload(PDF.toString('base64'), screenshotUpload(1024))).toThrow(
      /cannot be uploaded/,
    );
    expect(() => assertUpload(PNG.toString('base64'), screenshotUpload(4))).toThrow(/too large/);
  });
});

describe('email escaping', () => {
  it('escapes values in markup by default', () => {
    expect(substitute('<mj-text>{{name}}</mj-text>', { name: '<img src=x onerror=a()>' })).toBe(
      '<mj-text>&lt;img src=x onerror=a()&gt;</mj-text>',
    );
    expect(escapeHtml(`"a" & 'b'`)).toBe('&quot;a&quot; &amp; &#39;b&#39;');
  });

  it('inserts trusted markup only when it is wrapped in rawHtml', () => {
    expect(substitute('<table>{{rows}}</table>', { rows: rawHtml('<tr><td>1</td></tr>') })).toBe(
      '<table><tr><td>1</td></tr></table>',
    );
  });

  it('leaves the subject as text, since a subject is not HTML', () => {
    const rendered = renderTemplate({
      subject: 'Invoice for {{client}}',
      mjml: '<mj-text>{{client}}</mj-text>',
      fragments: new Map(),
      variables: { client: 'Rao & Sons' },
    });
    expect(rendered.subject).toBe('Invoice for Rao & Sons');
    expect(rendered.mjml).toBe('<mj-text>Rao &amp; Sons</mj-text>');
  });

  it('escapes the name and subject in a custom email', () => {
    const mjml = customTemplate({ name: '<b>x</b>', subject: '<i>s</i>', message: 'hi' });
    expect(mjml).not.toContain('<b>x</b>');
    expect(mjml).not.toContain('<i>s</i>');
    expect(mjml).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
