/**
 * Turning an email body into something worth storing on a ticket.
 *
 * No database and no network: every rule here is a guess about how a mail client
 * formats a reply, so it is kept pure and unit-tested rather than discovered in
 * production on a thread that has quoted itself eight times.
 */

/**
 * Where the quoted history starts, in the three shapes mail clients write it:
 * Gmail/Apple Mail's attribution line, a block of `>` quoting, and Outlook's divider
 * (either the worded one or the row of underscores it puts above the quoted headers).
 */
const QUOTE_MARKERS: RegExp[] = [
  /^\s*-{2,}\s*Original Message\s*-{2,}\s*$/im,
  /^\s*On\b.*\bwrote:\s*$/im,
  /^\s*>/m,
  /^\s*_{5,}\s*$/m,
];

/** The offset of the earliest marker in `text`, or -1 when it quotes nothing. */
function firstQuoteIndex(text: string): number {
  let earliest = -1;
  for (const marker of QUOTE_MARKERS) {
    const index = marker.exec(text)?.index ?? -1;
    if (index >= 0 && (earliest < 0 || index < earliest)) {
      earliest = index;
    }
  }
  return earliest;
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
