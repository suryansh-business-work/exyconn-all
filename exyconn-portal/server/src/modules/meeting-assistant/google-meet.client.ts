import { meteredFetch, pathAction } from '../tech/usage/usage.meter';
import { readGoogleConfig } from '../auth/google/google-sign-in.config';
import { TOKEN_URL } from '../auth/google/google-sign-in.oauth';
import { open } from '../../utils/secretBox';

const MEET_API = 'https://meet.googleapis.com/v2';
const REQUEST_TIMEOUT_MS = 30_000;
/** Pages read from one list before stopping: a bound, not an expected size. */
const MAX_PAGES = 20;

/** Google Meet REST API shapes (only the fields read). */
export interface ConferenceRecord {
  name: string;
  startTime?: string;
  endTime?: string;
}

export interface MeetParticipant {
  name: string;
  earliestStartTime?: string;
  latestEndTime?: string;
  signedinUser?: { displayName?: string };
  anonymousUser?: { displayName?: string };
  phoneUser?: { displayName?: string };
}

export interface ParticipantSession {
  startTime?: string;
  endTime?: string;
}

export interface Transcript {
  name: string;
  state?: 'STATE_UNSPECIFIED' | 'STARTED' | 'ENDED' | 'FILE_GENERATED';
}

export interface TranscriptEntry {
  participant?: string;
  text?: string;
  languageCode?: string;
  startTime?: string;
  endTime?: string;
}

/** A fresh access token from the person's sealed refresh token. */
export async function accessTokenFor(sealedRefreshToken: string): Promise<string> {
  const client = await readGoogleConfig();
  const response = await meteredFetch('GOOGLE_CALENDAR', 'POST oauth token', TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: client.clientId,
      client_secret: client.clientSecret,
      refresh_token: open(sealedRefreshToken),
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = (await response.json()) as { access_token?: string; error?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(
      `Google refused the Meet connection (${body.error ?? response.status}). Reconnect it.`,
    );
  }
  return body.access_token;
}

async function get<T>(token: string, path: string, query: Record<string, string> = {}): Promise<T> {
  const url = `${MEET_API}/${path}?${new URLSearchParams(query).toString()}`;
  const response = await meteredFetch(
    'GOOGLE_CALENDAR',
    pathAction('GET', new URL(url).pathname),
    url,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Meet API ${response.status}: ${detail.slice(0, 200)}`);
  }
  return (await response.json()) as T;
}

interface PagedList {
  token: string;
  path: string;
  key: string;
  query: Record<string, string>;
}

/**
 * Every item of a paged list from `pageToken` on. Pages are read one after another because
 * each page names the next; at most `pagesLeft` more are read.
 */
async function pagesFrom<T>(list: PagedList, pageToken: string, pagesLeft: number): Promise<T[]> {
  const body = await get<Record<string, unknown>>(list.token, list.path, {
    ...list.query,
    pageSize: '100',
    ...(pageToken ? { pageToken } : {}),
  });
  const items = (body[list.key] as T[] | undefined) ?? [];
  const next = typeof body.nextPageToken === 'string' ? body.nextPageToken : '';
  if (!next || pagesLeft <= 1) {
    return items;
  }
  return [...items, ...(await pagesFrom<T>(list, next, pagesLeft - 1))];
}

/** Every item of a paged list, following nextPageToken up to MAX_PAGES. */
function all<T>(
  token: string,
  path: string,
  key: string,
  query: Record<string, string> = {},
): Promise<T[]> {
  return pagesFrom<T>({ token, path, key, query }, '', MAX_PAGES);
}

export const meetApi = {
  conferenceRecords: (token: string, meetingCode: string) =>
    all<ConferenceRecord>(token, 'conferenceRecords', 'conferenceRecords', {
      filter: `space.meeting_code = "${meetingCode}"`,
    }),
  participants: (token: string, record: string) =>
    all<MeetParticipant>(token, `${record}/participants`, 'participants'),
  participantSessions: (token: string, participant: string) =>
    all<ParticipantSession>(token, `${participant}/participantSessions`, 'participantSessions'),
  transcripts: (token: string, record: string) =>
    all<Transcript>(token, `${record}/transcripts`, 'transcripts'),
  entries: (token: string, transcript: string) =>
    all<TranscriptEntry>(token, `${transcript}/entries`, 'transcriptEntries'),
};

/** A participant's name as Meet shows it, whichever kind of user they were. */
export function displayNameOf(participant: MeetParticipant): string {
  return (
    participant.signedinUser?.displayName ??
    participant.anonymousUser?.displayName ??
    participant.phoneUser?.displayName ??
    'Unknown participant'
  );
}
