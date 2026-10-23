/**
 * Reads a mailbox's stored `lastError` — the provider's refusal, often with its JSON body, e.g.
 * `Gmail /messages/send failed (403): { "error": { "message": "Gmail API has not been used…" } }`
 * — into what the table and the details dialog show. Labels and fixes are English source
 * strings for `t()`; the summary and the link are the provider's own words.
 */
export interface MailboxErrorInfo {
  /** A short status, e.g. "Send failed". */
  label: string;
  /** The provider's own explanation, without the request detail around it. */
  summary: string;
  /** The whole error, with a JSON body laid out to read. */
  details: string;
  /** What to do about it, when the error is a known one. */
  fix?: string;
  /** Where to do it, taken from the error itself (never made up). */
  fixUrl?: string;
}

interface ProviderErrorBody {
  error?: { message?: unknown } | string;
  error_description?: unknown;
}

const KNOWN_FIXES: ReadonlyArray<{ pattern: RegExp; fix: string }> = [
  {
    pattern: /SERVICE_DISABLED|accessNotConfigured|has not been used in project|is disabled/i,
    fix: 'Enable the Gmail API for this Google Cloud project, then test the mailbox again.',
  },
  {
    pattern:
      /ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficient\w* (authentication )?scopes?|insufficientPermissions/i,
    fix: 'Reconnect the mailbox and allow every permission the sign-in page asks for.',
  },
  {
    pattern: /invalid_grant|expired|revoked|refused the (stored )?connection|\(401\)/i,
    fix: 'Reconnect the mailbox: its sign-in expired or was revoked.',
  },
];

/** The `"message": "…"` of a JSON body cut short before it closed (rows saved by older releases). */
const QUOTED_MESSAGE = /"message"\s*:\s*"([^"]+)/;
const URL_PATTERN = /https:\/\/[^\s"'\\<>]+/g;
const TRAILING_PUNCTUATION = /[.,;:)]+$/;

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function labelOf(text: string): string {
  if (/\/messages\/send |\/me\/sendMail /.test(text)) {
    return 'Send failed';
  }
  if (/\/threads|\/messages\//.test(text)) {
    return 'Sync failed';
  }
  if (/\/profile |\/me /.test(text)) {
    return 'Test failed';
  }
  return 'Error';
}

function messageOf(body: ProviderErrorBody | undefined): string | undefined {
  const error = body?.error;
  const message = typeof error === 'object' ? error.message : body?.error_description;
  return typeof message === 'string' ? message : undefined;
}

/** The provider's link that goes with the fix: Google's console first, else the first link. */
function fixUrlOf(text: string): string | undefined {
  const urls = (text.match(URL_PATTERN) ?? []).map((url) => url.replace(TRAILING_PUNCTUATION, ''));
  return urls.find((url) => url.includes('console.')) ?? urls[0];
}

export function describeMailboxError(text: string): MailboxErrorInfo {
  const start = text.indexOf('{');
  const body =
    start === -1 ? undefined : (parseJson(text.slice(start)) as ProviderErrorBody | undefined);
  const head = start === -1 ? text : text.slice(0, start).trim();
  const details = body ? `${head}\n${JSON.stringify(body, null, 2)}` : text;
  const known = KNOWN_FIXES.find(({ pattern }) => pattern.test(text));
  return {
    label: labelOf(text),
    summary: messageOf(body) ?? QUOTED_MESSAGE.exec(text)?.[1] ?? text,
    details,
    fix: known?.fix,
    fixUrl: known ? fixUrlOf(text) : undefined,
  };
}
