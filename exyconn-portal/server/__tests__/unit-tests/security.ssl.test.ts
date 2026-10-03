import {
  altNames,
  certificateRow,
  classify,
  daysUntil,
  httpsHost,
  issuerLabel,
  monitorHosts,
  unreachableRow,
} from '../../src/modules/security/ssl.certificates';
import { mapWithConcurrency } from '../../src/modules/security/concurrency';
import { clearSslCache, sslCertificates } from '../../src/modules/security/ssl.service';
import { readCertificate } from '../../src/modules/security/ssl.probe';
import { StatusMonitorModel } from '../../src/modules/status/status-monitor.model';
import { env } from '../../src/config/env';

jest.mock('../../src/modules/security/ssl.probe', () => ({ readCertificate: jest.fn() }));
const probe = readCertificate as jest.Mock;

const NOW = new Date('2026-10-04T00:00:00Z');
const DAY = 86_400_000;
const host = { host: 'portal.exyconn.com', monitors: ['Portal'] };

/** A handshake whose certificate expires `days` after NOW. */
const handshake = (days: number, authorized = true) => ({
  certificate: {
    subject: { CN: 'portal.exyconn.com' },
    issuer: { O: "Let's Encrypt", CN: 'R11' },
    subjectaltname: 'DNS:portal.exyconn.com, DNS:www.exyconn.com',
    valid_from: 'Sep  1 00:00:00 2026 GMT',
    valid_to: new Date(NOW.getTime() + days * DAY).toUTCString(),
    serialNumber: '0A1B',
    fingerprint256: 'AA:BB',
  },
  protocol: 'TLSv1.3',
  authorized,
  authorizationError: authorized ? '' : 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
});

describe('which hosts are checked', () => {
  it('takes the https host of a monitor URL, lower-cased', () => {
    expect(httpsHost('https://Portal.Exyconn.com/health')).toBe('portal.exyconn.com');
    expect(httpsHost('http://exyconn.com')).toBeNull();
    expect(httpsHost('not a url')).toBeNull();
  });

  it('lists each host once with every monitor that points at it, sorted', () => {
    expect(
      monitorHosts([
        { name: 'Portal', url: 'https://portal.exyconn.com' },
        { name: 'API', url: 'https://api.exyconn.com/health' },
        { name: 'Portal health', url: 'https://portal.exyconn.com/health' },
        { name: 'Plain', url: 'http://legacy.exyconn.com' },
      ]),
    ).toEqual([
      { host: 'api.exyconn.com', monitors: ['API'] },
      { host: 'portal.exyconn.com', monitors: ['Portal', 'Portal health'] },
    ]);
  });
});

describe('reading a certificate', () => {
  it('labels the issuer by organization and common name, whichever it has', () => {
    expect(issuerLabel({ O: "Let's Encrypt", CN: 'R11' })).toBe("Let's Encrypt (R11)");
    expect(issuerLabel({ O: 'Acme CA' })).toBe('Acme CA');
    expect(issuerLabel({ CN: 'Self' })).toBe('Self');
    expect(issuerLabel(undefined)).toBe('');
  });

  it('splits the subject alternative names and drops their type prefix', () => {
    expect(altNames('DNS:a.com, DNS:b.com, IP Address:1.2.3.4')).toEqual([
      'a.com',
      'b.com',
      '1.2.3.4',
    ]);
    expect(altNames(undefined)).toEqual([]);
  });

  it('counts whole days left, negative once expired', () => {
    expect(daysUntil(new Date(NOW.getTime() + 10.5 * DAY), NOW)).toBe(10);
    expect(daysUntil(new Date(NOW.getTime() - DAY / 2), NOW)).toBe(-1);
  });
});

describe('certificate status', () => {
  it('puts expired before an invalid chain, then the warning window', () => {
    expect(classify(-1, false, 30)).toBe('EXPIRED');
    expect(classify(90, false, 30)).toBe('INVALID');
    expect(classify(null, true, 30)).toBe('INVALID');
    expect(classify(30, true, 30)).toBe('EXPIRING');
    expect(classify(31, true, 30)).toBe('OK');
  });

  it('turns a handshake into a full row', () => {
    const row = certificateRow(host, handshake(60), 30, NOW);
    expect(row).toMatchObject({
      host: 'portal.exyconn.com',
      monitors: ['Portal'],
      status: 'OK',
      subject: 'portal.exyconn.com',
      altNames: ['portal.exyconn.com', 'www.exyconn.com'],
      issuer: "Let's Encrypt (R11)",
      daysLeft: 60,
      serialNumber: '0A1B',
      fingerprint256: 'AA:BB',
      protocol: 'TLSv1.3',
      authorized: true,
      error: '',
      checkedAt: NOW,
    });
    expect(row.validFrom).toEqual(new Date('2026-09-01T00:00:00Z'));
  });

  it('reports why an untrusted chain failed, and repeated name fields joined', () => {
    const result = handshake(60, false);
    result.certificate.subject = { CN: ['a.com', 'b.com'] } as unknown as { CN: string };
    const row = certificateRow(host, result, 30, NOW);
    expect(row.status).toBe('INVALID');
    expect(row.subject).toBe('a.com, b.com');
    expect(row.error).toBe('UNABLE_TO_VERIFY_LEAF_SIGNATURE');
  });

  it('treats a certificate without readable dates as invalid', () => {
    const row = certificateRow(host, { ...handshake(60), certificate: {} }, 30, NOW);
    expect(row).toMatchObject({
      status: 'INVALID',
      validFrom: null,
      validTo: null,
      daysLeft: null,
      serialNumber: '',
      fingerprint256: '',
    });
    const garbled = certificateRow(
      host,
      { ...handshake(60), certificate: { valid_to: 'not a date' } },
      30,
      NOW,
    );
    expect(garbled.validTo).toBeNull();
  });

  it('describes a host it never reached', () => {
    expect(unreachableRow(host, 'ECONNREFUSED', NOW)).toMatchObject({
      status: 'UNREACHABLE',
      error: 'ECONNREFUSED',
      daysLeft: null,
      authorized: false,
    });
  });
});

describe('bounded concurrency', () => {
  it('keeps the input order and never runs more than the limit at once', async () => {
    let running = 0;
    let peak = 0;
    const result = await mapWithConcurrency([30, 10, 20, 5], 2, async (ms) => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, ms));
      running -= 1;
      return ms * 2;
    });
    expect(result).toEqual([60, 20, 40, 10]);
    expect(peak).toBe(2);
    await expect(mapWithConcurrency([], 3, async (n: number) => n)).resolves.toEqual([]);
  });
});

describe('the certificate report', () => {
  const monitor = (key: string, url: string, isActive = true) => ({
    key,
    name: key,
    url,
    isActive,
    category: 'PORTAL',
  });

  beforeEach(async () => {
    clearSslCache();
    await StatusMonitorModel.create([
      monitor('portal', 'https://portal.exyconn.com'),
      monitor('down', 'https://down.exyconn.com'),
      monitor('odd', 'https://odd.exyconn.com'),
      monitor('retired', 'https://retired.exyconn.com', false),
    ]);
  });

  it('checks every active monitored host and never fails on one bad host', async () => {
    // A non-Error rejection still becomes a row, not a failed report.
    const outcomes = new Map<string, Promise<unknown>>([
      ['down.exyconn.com', Promise.reject(new Error('ECONNREFUSED'))],
      ['odd.exyconn.com', Promise.reject({ code: 'EPIPE' })],
    ]);
    for (const outcome of outcomes.values()) outcome.catch(() => undefined);
    probe.mockImplementation((name: string) => outcomes.get(name) ?? Promise.resolve(handshake(5)));
    const report = await sslCertificates();
    expect(report.warningDays).toBe(env.security.sslWarningDays);
    expect(report.certificates.map((row) => [row.host, row.status, row.error])).toEqual([
      ['down.exyconn.com', 'UNREACHABLE', 'ECONNREFUSED'],
      ['odd.exyconn.com', 'UNREACHABLE', 'The host could not be reached'],
      ['portal.exyconn.com', 'EXPIRING', ''],
    ]);
    expect(probe).toHaveBeenCalledWith('portal.exyconn.com', env.security.sslTimeoutMs);
  });

  it('reuses a fresh report and checks again on refresh', async () => {
    probe.mockResolvedValue(handshake(90));
    const first = await sslCertificates();
    const again = await sslCertificates();
    expect(again).toBe(first);
    expect(probe).toHaveBeenCalledTimes(3);
    const refreshed = await sslCertificates(true);
    expect(refreshed).not.toBe(first);
    expect(probe).toHaveBeenCalledTimes(6);
  });
});
