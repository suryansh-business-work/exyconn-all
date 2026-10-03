/**
 * The pure half of the SSL certificate monitor: which hosts to check, and what a certificate
 * read off a TLS handshake means. No sockets here, so every rule is testable on its own.
 */

export const SSL_STATUSES = ['OK', 'EXPIRING', 'EXPIRED', 'INVALID', 'UNREACHABLE'] as const;
export type SslStatus = (typeof SSL_STATUSES)[number];

const DAY_MS = 86_400_000;

/** A status monitor, as far as the certificate check cares. */
export interface MonitorRef {
  name: string;
  url: string;
}

/** One host to check, and the monitors that point at it. */
export interface SslHost {
  host: string;
  monitors: string[];
}

/** The fields of node's PeerCertificate the report reads. */
export interface PeerCertificateLike {
  subject?: Record<string, string | string[] | undefined>;
  issuer?: Record<string, string | string[] | undefined>;
  subjectaltname?: string;
  valid_from?: string;
  valid_to?: string;
  serialNumber?: string;
  fingerprint256?: string;
}

/** What a finished handshake told us, before it is judged. */
export interface HandshakeResult {
  certificate: PeerCertificateLike;
  protocol: string;
  authorized: boolean;
  authorizationError: string;
}

/** One row of the report. */
export interface SslCertificateRow {
  host: string;
  monitors: string[];
  status: SslStatus;
  subject: string;
  altNames: string[];
  issuer: string;
  validFrom: Date | null;
  validTo: Date | null;
  daysLeft: number | null;
  serialNumber: string;
  fingerprint256: string;
  protocol: string;
  authorized: boolean;
  error: string;
  checkedAt: Date;
}

/** The https host of a monitor URL, lower-cased; null for anything that is not https. */
export function httpsHost(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? parsed.hostname.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** Distinct https hosts across the monitors, each with the monitors that use it, sorted. */
export function monitorHosts(monitors: readonly MonitorRef[]): SslHost[] {
  const byHost = new Map<string, string[]>();
  for (const monitor of monitors) {
    const host = httpsHost(monitor.url);
    if (host) {
      byHost.set(host, [...(byHost.get(host) ?? []), monitor.name]);
    }
  }
  return [...byHost.entries()]
    .map(([host, names]) => ({ host, monitors: names }))
    .sort((a, b) => a.host.localeCompare(b.host));
}

/** A distinguished-name field, which node gives as an array when it repeats. */
function nameField(name: PeerCertificateLike['subject'], key: string): string {
  const value = name?.[key];
  return Array.isArray(value) ? value.join(', ') : (value ?? '');
}

/** "Let's Encrypt (R11)", or whichever of the two the issuer carries. */
export function issuerLabel(issuer: PeerCertificateLike['issuer']): string {
  const organization = nameField(issuer, 'O');
  const commonName = nameField(issuer, 'CN');
  if (organization && commonName) {
    return `${organization} (${commonName})`;
  }
  return organization || commonName;
}

/** "DNS:a.com, DNS:b.com, IP Address:1.2.3.4" -> ["a.com", "b.com", "1.2.3.4"]. */
export function altNames(subjectAltName: string | undefined): string[] {
  if (!subjectAltName) {
    return [];
  }
  return subjectAltName
    .split(',')
    .map((entry) => entry.trim().replace(/^[^:]+:/, ''))
    .filter((entry) => entry !== '');
}

/** A certificate date, or null when node gave nothing readable. */
function certificateDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Whole days until `validTo`, negative once it has passed. */
export function daysUntil(validTo: Date, now: Date): number {
  return Math.floor((validTo.getTime() - now.getTime()) / DAY_MS);
}

/**
 * The verdict, most serious first: an expired certificate is EXPIRED even though the chain
 * check also failed; any other failed chain check is INVALID; then the warning window.
 */
export function classify(
  daysLeft: number | null,
  authorized: boolean,
  warningDays: number,
): SslStatus {
  if (daysLeft !== null && daysLeft < 0) {
    return 'EXPIRED';
  }
  if (!authorized || daysLeft === null) {
    return 'INVALID';
  }
  return daysLeft <= warningDays ? 'EXPIRING' : 'OK';
}

/** A host the handshake never completed with. */
export function unreachableRow(host: SslHost, error: string, now: Date): SslCertificateRow {
  return {
    ...host,
    status: 'UNREACHABLE',
    subject: '',
    altNames: [],
    issuer: '',
    validFrom: null,
    validTo: null,
    daysLeft: null,
    serialNumber: '',
    fingerprint256: '',
    protocol: '',
    authorized: false,
    error,
    checkedAt: now,
  };
}

/** A completed handshake, judged. */
export function certificateRow(
  host: SslHost,
  result: HandshakeResult,
  warningDays: number,
  now: Date,
): SslCertificateRow {
  const { certificate } = result;
  const validTo = certificateDate(certificate.valid_to);
  const daysLeft = validTo ? daysUntil(validTo, now) : null;
  return {
    ...host,
    status: classify(daysLeft, result.authorized, warningDays),
    subject: nameField(certificate.subject, 'CN'),
    altNames: altNames(certificate.subjectaltname),
    issuer: issuerLabel(certificate.issuer),
    validFrom: certificateDate(certificate.valid_from),
    validTo,
    daysLeft,
    serialNumber: certificate.serialNumber ?? '',
    fingerprint256: certificate.fingerprint256 ?? '',
    protocol: result.protocol,
    authorized: result.authorized,
    error: result.authorizationError,
    checkedAt: now,
  };
}
