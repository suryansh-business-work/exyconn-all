import { GOOGLE_MEET_CODE } from '@exyconn/regex';

const MEET_ORIGIN = 'https://meet.google.com';

/**
 * The meeting code in a Google Meet call URL (`abc-defg-hij`), or null for anything that is
 * not a call: the landing page, `/new`, another site or text that is not a URL at all.
 */
export function meetingCodeFromUrl(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.origin !== MEET_ORIGIN) {
    return null;
  }
  return GOOGLE_MEET_CODE.exec(url.pathname)?.[1] ?? null;
}

/** The canonical address of a call, without the query string Meet appends (authuser, hs…). */
export function canonicalMeetUrl(code: string): string {
  return `${MEET_ORIGIN}/${code}`;
}
