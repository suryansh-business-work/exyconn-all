import { vi } from 'vitest';
import { jsonResponse, type ChromeMock } from './chrome-mock';

export const ORG = {
  userId: 'u1',
  name: 'Asha Rao',
  email: 'asha@acme.test',
  organizationName: 'Acme',
  enabled: true,
  remindersEnabled: true,
  reminderIntervalMinutes: 2,
  maxRemindersPerMeeting: 3,
  participantTracking: true,
  liveTranscript: true,
  maxMeetingMinutes: 60,
  portalUrl: 'https://employee.test',
  saveRecordings: false,
};

type Handler = (variables: Record<string, unknown>) => unknown;

const meeting = (consent: string | null) => ({
  id: 'm1',
  startedAt: '2026-10-20T10:00:00.000Z',
  status: 'ACTIVE',
  consentRecordedAt: consent,
});

/** Default answers per GraphQL operation name. A handler that throws becomes a GraphQL error. */
function defaults(): Record<string, Handler> {
  return {
    MaExtensionContext: () => ({ maExtensionContext: ORG }),
    LocaleBundle: () => ({
      localeBundle: { locale: 'en-US', translations: [{ source: 'Remind later', text: 'Later' }] },
    }),
    MaStartSession: () => ({ maStartSession: meeting(null) }),
    MaRecordConsent: () => ({
      maRecordConsent: { id: 'm1', consentRecordedAt: '2026-10-20T10:01:00.000Z' },
    }),
    MaHeartbeat: () => ({ maHeartbeat: { id: 'm1', status: 'ACTIVE' } }),
    MaRecordParticipantEvents: (v) => ({
      maRecordParticipantEvents: (v.events as unknown[]).length,
    }),
    MaFinalizeSession: () => ({ maFinalizeSession: { id: 'm1', status: 'ENDED' } }),
    MaFollowUp: () => ({
      maFollowUp: {
        previousMeeting: null,
        pendingActions: [],
        overdueActions: [],
        unresolvedBlockers: [],
        carriedTopics: [],
      },
    }),
    MaTranscript: () => ({
      maTranscript: [
        { id: 't1', startMs: 0, endMs: 900, text: 'Hello', speakerLabel: 'A', speakerName: null },
      ],
    }),
    MaParticipants: () => ({ maParticipants: [] }),
    MaNotes: () => ({
      maMeeting: { id: 'm1', summaryStatus: 'NOT_STARTED' },
      maNotes: null,
      maDecisions: [],
    }),
    MaActionItems: () => ({ maActionItemsPaged: { rows: [], totalCount: 0 } }),
    MaSetActionStatus: (v) => ({ maSetActionStatus: { id: v.id, status: v.status } }),
    ReportClientLogs: () => ({ reportClientLogs: true }),
  };
}

const tokens = (n: number) => ({
  access_token: `access-${n}`,
  token_type: 'Bearer',
  expires_in: 900,
  refresh_token: `refresh-${n}`,
  refresh_expires_in: 86_400,
});

/** One screen-recording piece as the portal received it. */
export interface ReceivedVideo {
  meetingId: string;
  seq: number;
  part: string | null;
  durationMs: string | null;
  contentType: string | null;
  bytes: Uint8Array;
}

function receiveVideo(url: string, init: RequestInit): ReceivedVideo {
  const parsed = new URL(url);
  const [meetingId, seq] = parsed.pathname.split('/').slice(-2);
  return {
    meetingId,
    seq: Number(seq),
    part: parsed.searchParams.get('part'),
    durationMs: parsed.searchParams.get('durationMs'),
    contentType: new Headers(init.headers).get('Content-Type'),
    bytes: init.body as Uint8Array,
  };
}

/**
 * The portal as the extension sees it: GraphQL by operation name, the token and revoke
 * endpoints, and the audio and video endpoints (answers queued per test).
 */
export function fakePortal() {
  const graphql = defaults();
  const calls: Array<{ op: string; variables: Record<string, unknown> }> = [];
  const audio: Array<Record<string, unknown>> = [];
  const audioReplies: Response[] = [];
  const video: ReceivedVideo[] = [];
  const videoReplies: Response[] = [];
  const tokenReplies: Response[] = [];
  const fetchMock = vi.fn((url: string, init: RequestInit): Promise<Response> => {
    if (url.includes('/meet-assistant/video/')) {
      video.push(receiveVideo(url, init));
      return Promise.resolve(videoReplies.shift() ?? jsonResponse(200, { status: 'STORED' }));
    }
    const body =
      init.body === undefined ? {} : (JSON.parse(String(init.body)) as Record<string, unknown>);
    if (url.endsWith('/graphql')) {
      const op = /(?:query|mutation) (\w+)/.exec(String(body.query))?.[1] ?? '';
      const variables = (body.variables ?? {}) as Record<string, unknown>;
      calls.push({ op, variables });
      try {
        return Promise.resolve(jsonResponse(200, { data: graphql[op](variables) }));
      } catch (error) {
        return Promise.resolve(
          jsonResponse(200, { errors: [{ message: (error as Error).message }] }),
        );
      }
    }
    if (url.endsWith('/meet-assistant/audio')) {
      audio.push(body);
      return Promise.resolve(
        audioReplies.shift() ?? jsonResponse(200, { status: 'DONE', segments: [] }),
      );
    }
    if (url.endsWith('/meet-assistant/auth/token')) {
      return Promise.resolve(tokenReplies.shift() ?? jsonResponse(200, tokens(2)));
    }
    return Promise.resolve(jsonResponse(204, null));
  });
  vi.stubGlobal('fetch', fetchMock);
  const ops = (op: string) => calls.filter((call) => call.op === op);
  return { graphql, calls, ops, audio, audioReplies, video, videoReplies, tokenReplies, fetchMock };
}

export type FakePortal = ReturnType<typeof fakePortal>;

/** Stores a live sign-in, as a completed code exchange would. */
export async function seedSignIn(chrome: ChromeMock): Promise<void> {
  const far = Date.now() + 86_400_000;
  await chrome.storage.session.set({ 'auth.access': { token: 'access-1', expiresAt: far } });
  await chrome.storage.local.set({ 'auth.refresh': { token: 'refresh-1', expiresAt: far } });
}
