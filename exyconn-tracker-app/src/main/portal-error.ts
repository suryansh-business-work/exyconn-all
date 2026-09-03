const HTTP_STATUS = /HTTP (\d{3})/;

/**
 * The HTTP status a portal failure carried, or null when it was not an HTTP failure at all
 * (an offline `fetch`, or an error the portal answered 200 with).
 *
 * The status is read back out of the message because that is where `portal-client` puts it —
 * one reader, so the two places that turn a failure into a sentence cannot disagree.
 */
export function httpStatusOf(error: unknown): number | null {
  if (!(error instanceof Error)) {
    return null;
  }
  const match = HTTP_STATUS.exec(error.message);
  return match === null ? null : Number.parseInt(match[1], 10);
}
