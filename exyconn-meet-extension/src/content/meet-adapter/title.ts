import { TITLE_PREFIXES } from './selectors';

/** The call's name from the tab title ("Meet - Weekly sync"), else the meeting code. */
export function readMeetingTitle(doc: Document, meetingCode: string): string {
  const raw = doc.title.trim();
  const prefix = TITLE_PREFIXES.find((candidate) => raw.startsWith(candidate));
  const title = prefix === undefined ? '' : raw.slice(prefix.length).trim();
  return title.length > 0 ? title : meetingCode;
}
