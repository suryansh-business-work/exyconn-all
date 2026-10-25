import { vi } from 'vitest';
import type { AudioStream } from '../../../src/types/meeting';
import type {
  MeetReport,
  RecorderCommand,
  RecorderReport,
  WorkerReply,
  WorkerRequest,
} from '../../../src/types/messages';
import type { TabSession } from '../../../src/storage/session-registry';
import { dispatchMessage, installChrome } from '../chrome-mock';
import { fakePortal, seedSignIn } from '../fake-portal';

export const EXT = 'test-extension-id';
export const TAB = 5;
export const CODE = 'abc-defg-hij';

/** Boots a fresh service worker (new module graph, new fake chrome and portal). */
export async function startWorker({ signedIn = true } = {}) {
  vi.resetModules();
  const chrome = installChrome();
  const portal = fakePortal();
  if (signedIn) {
    await seedSignIn(chrome);
  }
  await import('../../../src/background/index');
  const send = (message: unknown, sender: chrome.runtime.MessageSender = { id: EXT }) =>
    dispatchMessage(chrome, message, sender) as Promise<WorkerReply<unknown> | undefined>;
  const fromTab = (message: WorkerRequest, tabId = TAB) =>
    send(message, { id: EXT, tab: { id: tabId } as chrome.tabs.Tab });
  /** The commands the worker sent to the recorder in a tab's page, in order. */
  const recorderCommands = (tabId = TAB): Array<RecorderCommand['type']> =>
    chrome.tabs.sendMessage.mock.calls
      .filter(([to, message]) => to === tabId && (message as RecorderCommand).target === 'recorder')
      .map(([, message]) => (message as RecorderCommand).type);
  const session = async (tabId = TAB): Promise<TabSession | undefined> => {
    const stored = await chrome.storage.session.get('sessions');
    return (stored.sessions as Record<string, TabSession> | undefined)?.[tabId];
  };
  const alarm = (name: string) =>
    chrome.alarms.onAlarm.emit({ name, scheduledTime: 0, persistAcrossSessions: false });
  return { chrome, portal, send, fromTab, recorderCommands, session, alarm };
}

export type Worker = Awaited<ReturnType<typeof startWorker>>;

export function report(overrides: Partial<MeetReport> = {}): WorkerRequest {
  return {
    type: 'meet/report',
    report: {
      meetingCode: CODE,
      url: `https://meet.google.com/${CODE}`,
      title: 'Weekly sync',
      meetingState: 'IN_MEETING',
      transcriptionState: 'ON',
      participants: [],
      participantsComplete: false,
      ...overrides,
    },
  };
}

export const hello = (code = CODE): WorkerRequest => ({
  type: 'meet/hello',
  page: { meetingCode: code, url: `https://meet.google.com/${code}`, title: code },
});

/** Opens a Meet tab and joins the call (the worker opens the server session). */
export async function joinCall(worker: Worker, tabId = TAB, overrides: Partial<MeetReport> = {}) {
  await worker.fromTab(hello(), tabId);
  await worker.fromTab(report(overrides), tabId);
}

/** Joins and records consent, as the panel's consent dialog does. */
export async function consent(worker: Worker, tabId = TAB) {
  await joinCall(worker, tabId);
  return worker.fromTab({ type: 'capture/consent' }, tabId);
}

/**
 * Joins, records consent and starts capture the way the page's recorder does: it asks for
 * the plan, then reports that every recorder runs. Answers the plan reply.
 */
export async function startCapture(worker: Worker, tabId = TAB, micEnabled = false) {
  await consent(worker, tabId);
  const plan = await worker.fromTab({ type: 'recorder/prepare' }, tabId);
  await worker.fromTab({ type: 'recorder/started', micEnabled }, tabId);
  return plan;
}

/** One transcription chunk from the page's recorder. */
export function audio(seq = 0, stream: AudioStream = 'TAB'): RecorderReport {
  return {
    type: 'recorder/audio',
    chunk: {
      meetingId: 'm1',
      stream,
      startMs: seq * 15_000,
      durationMs: 15_000,
      audio: 'GkXfow==',
    },
  };
}

/** One screen-recording piece from the page's recorder. */
export function piece(seq = 0, part = 0): RecorderReport {
  return {
    type: 'recorder/video',
    piece: { meetingId: 'm1', part, seq, durationMs: 5000, data: 'GkXfow==' },
  };
}

/** The page's recorder flushed and released everything. */
export const ended = (reason: string | null = null): RecorderReport => ({
  type: 'recorder/ended',
  reason,
});
