import { env } from '../../config/env';
import type { VerificationStatus } from './email-verification.model';

/** A check takes seconds (an SMTP conversation); past this the answer is "unknown". */
const TIMEOUT_MS = 90_000;

/** Reacher's answer (github.com/reacherhq/check-if-email-exists, JSON output). */
interface ReacherOutput {
  is_reachable?: 'safe' | 'risky' | 'invalid' | 'unknown';
  misc?: { is_disposable?: boolean; is_role_account?: boolean };
  mx?: { accepts_mail?: boolean };
  smtp?: {
    can_connect_smtp?: boolean;
    has_full_inbox?: boolean;
    is_catch_all?: boolean;
    is_deliverable?: boolean;
    is_disabled?: boolean;
  };
  syntax?: { is_valid_syntax?: boolean; suggestion?: string | null };
}

/** A SOCKS5 proxy that may speak SMTP on port 25 (Tech > Environment Variables). */
export interface ReacherProxy {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

/** One check, in the shape the verifier stores. */
export interface CheckResult {
  status: VerificationStatus;
  reason: string;
  syntaxValid: boolean;
  hasMx: boolean;
  deliverable: boolean;
  catchAll: boolean;
  disposable: boolean;
  roleAccount: boolean;
  suggestion: string;
}

const STATUS_OF: Record<NonNullable<ReacherOutput['is_reachable']>, VerificationStatus> = {
  safe: 'VERIFIED',
  risky: 'RISKY',
  invalid: 'INVALID',
  unknown: 'UNKNOWN',
};

/** The most telling reason for the result, in the order a person would want to hear it. */
function reasonOf(output: ReacherOutput): string {
  const { syntax, mx, smtp, misc } = output;
  const reasons: Array<[boolean | undefined, string]> = [
    [syntax?.is_valid_syntax === false, 'Not a valid email address'],
    [mx?.accepts_mail === false, 'The domain does not receive email'],
    [smtp?.is_disabled, 'The mailbox is disabled'],
    [smtp?.has_full_inbox, 'The mailbox is full'],
    [smtp?.can_connect_smtp === false, 'The mail server could not be reached'],
    [misc?.is_disposable, 'A disposable address'],
    [smtp?.is_catch_all, 'The domain accepts every address (catch-all)'],
    [misc?.is_role_account, 'A role address (info@, sales@ …)'],
    [smtp?.is_deliverable, 'The mailbox exists and accepts email'],
    [smtp?.is_deliverable === false, 'The mailbox does not exist'],
  ];
  return reasons.find(([applies]) => applies)?.[1] ?? '';
}

export function toCheckResult(output: ReacherOutput): CheckResult {
  return {
    status: STATUS_OF[output.is_reachable ?? 'unknown'],
    reason: reasonOf(output),
    syntaxValid: output.syntax?.is_valid_syntax ?? false,
    hasMx: output.mx?.accepts_mail ?? false,
    deliverable: output.smtp?.is_deliverable ?? false,
    catchAll: output.smtp?.is_catch_all ?? false,
    disposable: output.misc?.is_disposable ?? false,
    roleAccount: output.misc?.is_role_account ?? false,
    suggestion: output.syntax?.suggestion ?? '',
  };
}

/** Asks the Reacher backend (its own container, never on the internet) about one address. */
export async function checkWithReacher(
  email: string,
  proxy: ReacherProxy | null,
): Promise<CheckResult> {
  const response = await fetch(`${env.reacherUrl}/v0/check_email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to_email: email, ...(proxy ? { proxy } : {}) }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`The email verifier answered HTTP ${response.status}`);
  }
  return toCheckResult((await response.json()) as ReacherOutput);
}
