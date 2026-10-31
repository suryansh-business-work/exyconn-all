/** The providers a company connects its CRM mailboxes from. */
export type MailboxProvider = 'GMAIL' | 'MICROSOFT';

export const HEALTH_CHECK_CODES = ['SPF', 'DKIM', 'DMARC', 'MX', 'BLACKLIST'] as const;
export type HealthCheckCode = (typeof HEALTH_CHECK_CODES)[number];

/** UNKNOWN: the lookup itself failed, so the check says nothing either way and is not scored. */
export const HEALTH_CHECK_STATUSES = ['PASS', 'WARN', 'FAIL', 'UNKNOWN'] as const;
export type HealthCheckStatus = (typeof HEALTH_CHECK_STATUSES)[number];

/**
 * One check on a sending domain. `message` and `fix` are fixed English sentences, so the portal
 * can translate them; what differs per domain is in `record` (what DNS has) and `suggested`
 * (a value to paste into DNS), which are never translated.
 */
export interface HealthCheck {
  code: HealthCheckCode;
  status: HealthCheckStatus;
  message: string;
  fix: string;
  record: string;
  suggested: string;
}

export type CheckResult = Omit<HealthCheck, 'code'>;

/** A check's outcome with the optional parts left blank. */
export const result = (
  status: HealthCheckStatus,
  message: string,
  extra: Partial<Pick<CheckResult, 'fix' | 'record' | 'suggested'>> = {},
): CheckResult => ({ status, message, fix: '', record: '', suggested: '', ...extra });

/** What a lookup that threw says, so one unreachable name never fails the whole domain. */
export const lookupFailed = (): CheckResult =>
  result('UNKNOWN', 'The DNS lookup failed. Try the check again in a few minutes.');
