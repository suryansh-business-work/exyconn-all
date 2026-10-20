import type {
  AudioStream,
  CaptureState,
  MeetingState,
  ReminderState,
  SeenParticipant,
  TranscriptionState,
} from '../types/meeting';
import type { ParticipantEvent } from '../utils/participants';
import { initialReminderState } from '../utils/reminders';
import { createSlot, isRecord, type KeyValueArea } from './area';

/** Everything the worker knows about one Meet tab. Survives the worker being suspended. */
export interface TabSession {
  tabId: number;
  /** Random per page load; stale offscreen chunks from an earlier load carry another key. */
  sessionKey: string;
  meetingCode: string;
  url: string;
  title: string;
  meetingId: string | null;
  meetingStartedAt: string | null;
  meetingState: MeetingState;
  transcriptionState: TranscriptionState;
  captureState: CaptureState;
  captureStartedAt: number | null;
  captureError: string | null;
  consentRecorded: boolean;
  micEnabled: boolean;
  /** True from `offscreen/start` until the recorder reports it has flushed and stopped. */
  recorderActive: boolean;
  pendingUploads: number;
  roster: SeenParticipant[];
  /** Participant changes not yet sent (batched, throttled). */
  pendingEvents: ParticipantEvent[];
  eventsFlushedAt: number;
  reminder: ReminderState;
  /** The call is over (or the tab is gone); finalize once the last audio is uploaded. */
  finalizePending: boolean;
  /** The tab was closed: drop the session once it has been finalized. */
  closing: boolean;
}

export function newTabSession(
  tabId: number,
  sessionKey: string,
  page: { meetingCode: string; url: string; title: string },
): TabSession {
  return {
    tabId,
    sessionKey,
    ...page,
    meetingId: null,
    meetingStartedAt: null,
    meetingState: 'PAGE_OPENED',
    transcriptionState: 'UNKNOWN',
    captureState: 'IDLE',
    captureStartedAt: null,
    captureError: null,
    consentRecorded: false,
    micEnabled: false,
    recorderActive: false,
    pendingUploads: 0,
    roster: [],
    pendingEvents: [],
    eventsFlushedAt: 0,
    reminder: initialReminderState(),
    finalizePending: false,
    closing: false,
  };
}

type SessionMap = Record<string, TabSession>;
type SeqMap = Record<string, Record<AudioStream, number>>;

function parseSessions(raw: unknown): SessionMap | null {
  return isRecord(raw) ? (raw as SessionMap) : null;
}

function parseSeqs(raw: unknown): SeqMap | null {
  return isRecord(raw) ? (raw as SeqMap) : null;
}

/** True while a tab holds the call's audio capture (recording or paused). */
export function isCapturing(session: TabSession): boolean {
  return session.captureState === 'RECORDING' || session.captureState === 'PAUSED';
}

export type SessionUpdate = (session: TabSession) => TabSession;

/**
 * The per-tab session registry, persisted in `storage.session` so a suspended worker picks
 * up where it left off. Every write is serialised: the worker handles messages concurrently,
 * and two read-modify-writes interleaving would lose one of them.
 */
export function createSessionRegistry(area: KeyValueArea) {
  const slot = createSlot(area, 'sessions', parseSessions);
  const seqSlot = createSlot(area, 'chunkSeqs', parseSeqs);
  let queue: Promise<unknown> = Promise.resolve();

  function serial<T>(work: () => Promise<T>): Promise<T> {
    const result = queue.then(work, work);
    // The caller receives `result` and its rejection; only the queue's tail is kept settled so
    // one failed write does not block every later one.
    queue = result.catch(() => undefined);
    return result;
  }

  const load = async (): Promise<SessionMap> => (await slot.read()) ?? {};

  return {
    all: (): Promise<TabSession[]> => serial(async () => Object.values(await load())),
    get: (tabId: number): Promise<TabSession | null> =>
      serial(async () => (await load())[tabId] ?? null),
    put: (session: TabSession): Promise<void> =>
      serial(async () => {
        const sessions = await load();
        await slot.write({ ...sessions, [session.tabId]: session });
      }),
    update: (tabId: number, change: SessionUpdate): Promise<TabSession | null> =>
      serial(async () => {
        const sessions = await load();
        const current = sessions[tabId];
        if (current === undefined) {
          return null;
        }
        const next = change(current);
        await slot.write({ ...sessions, [tabId]: next });
        return next;
      }),
    remove: (tabId: number): Promise<TabSession | null> =>
      serial(async () => {
        const sessions = await load();
        const current = sessions[tabId] ?? null;
        const rest = Object.fromEntries(
          Object.entries(sessions).filter(([key]) => key !== String(tabId)),
        );
        await slot.write(rest);
        return current;
      }),
    /**
     * The next X-Chunk-Seq for a meeting's stream. Kept per MEETING, not per tab, so a
     * restarted capture, a reloaded page or another tab of the same call never reuses a
     * number the server already holds (it would answer DUPLICATE and drop the audio).
     */
    takeSeq: (meetingId: string, stream: AudioStream): Promise<number> =>
      serial(async () => {
        const seqs = (await seqSlot.read()) ?? {};
        const current = seqs[meetingId] ?? { TAB: 0, MIC: 0 };
        await seqSlot.write({
          ...seqs,
          [meetingId]: { ...current, [stream]: current[stream] + 1 },
        });
        return current[stream];
      }),
    /** The other tab (if any) already capturing this call. */
    captureOwner: (meetingId: string, exceptTabId: number): Promise<TabSession | null> =>
      serial(async () => {
        const sessions = Object.values(await load());
        return (
          sessions.find(
            (s) => s.meetingId === meetingId && s.tabId !== exceptTabId && isCapturing(s),
          ) ?? null
        );
      }),
  };
}

export type SessionRegistry = ReturnType<typeof createSessionRegistry>;
