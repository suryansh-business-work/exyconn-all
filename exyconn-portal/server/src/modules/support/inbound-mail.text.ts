/**
 * Turning an email body into something worth storing on a ticket.
 *
 * No database and no network: every rule here is a guess about how a mail client
 * formats a reply, so it is kept pure and unit-tested rather than discovered in
 * production on a thread that has quoted itself eight times.
 */

const LINE_BREAK = /[\n\r\u2028\u2029]/;
const OUTLOOK_DIVIDER = /^-{2,}\s*Original Message\s*-{2,}$/i;
const UNDERSCORE_DIVIDER = /^_{5,}$/;
const ON_PREFIX = /^on\b/i;
const WROTE_SUFFIX = /wrote:$/i;
const WROTE_LENGTH = 'wrote:'.length;
const WORD_CHAR = /\w/;

/** `On ... wrote:` — the line Gmail and Apple Mail put above the history (`line` is trimmed). */
function isAttribution(line: string): boolean {
  const start = line.length - WROTE_LENGTH;
  return (
    ON_PREFIX.test(line) &&
    start >= 2 &&
    WROTE_SUFFIX.test(line) &&
    !WORD_CHAR.test(line[start - 1])
  );
}

/**
 * Whether a line opens the quoted history, in the three shapes mail clients write it:
 * Gmail/Apple Mail's attribution line, a block of `>` quoting, and Outlook's divider
 * (either the worded one or the row of underscores it puts above the quoted headers).
 */
function isQuoteLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('>') ||
    UNDERSCORE_DIVIDER.test(trimmed) ||
    OUTLOOK_DIVIDER.test(trimmed) ||
    isAttribution(trimmed)
  );
}

/**
 * The offset of the line where the quoted history starts, or -1 when `text` quotes nothing.
 * Read line by line: a `^\s*` pattern over the whole text crosses blank lines and backtracks
 * quadratically on a long run of them.
 */
function firstQuoteIndex(text: string): number {
  let offset = 0;
  for (const line of text.split(LINE_BREAK)) {
    if (isQuoteLine(line)) {
      return offset;
    }
    offset += line.length + 1;
  }
  return -1;
}

/**
 * The new part of a reply, with the history the sender's mail client quoted back at us
 * removed — otherwise a thread doubles in size with every message and the console shows
 * the same paragraph five times.
 *
 * A message that is *entirely* quotation is left whole: stripping it would leave the
 * ticket with nothing at all, and a body we cannot parse is still better than no body.
 */
export function stripQuotedReply(text: string): string {
  const cut = firstQuoteIndex(text);
  const kept = (cut < 0 ? text : text.slice(0, cut)).trim();
  return kept || text.trim();
}
