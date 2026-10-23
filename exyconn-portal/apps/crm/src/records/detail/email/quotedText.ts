/** Outlook's marker above the message being answered. */
const ORIGINAL_MESSAGE = 'Original Message';

const isQuoteLine = (line: string) => line.startsWith('>') || line.includes(ORIGINAL_MESSAGE);

/** Moves the start back over the "On …, X wrote:" lines (Gmail wraps them in two) above a quote. */
function withAttribution(lines: readonly string[], start: number) {
  let at = start - 1;
  while (at >= 0 && lines[at].trim() === '') {
    at -= 1;
  }
  if (at < 0 || !lines[at].trim().endsWith('wrote:')) {
    return start;
  }
  return at > 0 && lines[at - 1].trim().startsWith('On ') && !lines[at].trim().startsWith('On ')
    ? at - 1
    : at;
}

/**
 * Splits a plain-text message into what was written and the earlier mail quoted below it, like
 * Gmail's "Show trimmed content". A message that is all quote stays whole.
 */
export function splitQuoted(text: string): { main: string; quoted: string } {
  const lines = text.split('\n');
  const first = lines.findIndex((line) => isQuoteLine(line.trim()));
  const start = first < 0 ? -1 : withAttribution(lines, first);
  if (start <= 0) {
    return { main: text, quoted: '' };
  }
  return {
    main: lines.slice(0, start).join('\n').trimEnd(),
    quoted: lines.slice(start).join('\n'),
  };
}
