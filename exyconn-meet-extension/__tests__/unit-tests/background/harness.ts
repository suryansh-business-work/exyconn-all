import { vi } from 'vitest';
import type { MeetReport, WorkerReply, WorkerRequest } from '../../../src/types/messages';
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
  const fromOffscreen = (message: WorkerRequest) =>
    send(message, { id: EXT, url: chrome.runtime.getURL('offscreen.html') });
  const session = async (tabId = TAB): Promise<TabSession | undefined> => {
    const stored = await chrome.storage.session.get('sessions');
    return (stored.sessions as Record<string, TabSession> | undefined)?.[tabId];
  };
  const alarm = (name: string) =>
    chrome.alarms.onAlarm.emit({ name, scheduledTime: 0, persistAcrossSessions: false });
  return { chrome, portal, send, fromTab, fromOffscreen, session, alarm };
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

/** Joins, records consent and starts capture. */
export async function startCapture(worker: Worker, tabId = TAB) {
  await joinCall(worker, tabId);
  await worker.send({ type: 'capture/consent', tabId });
  return worker.send({ type: 'capture/start', tabId });
}

export function chunk(seq = 0): WorkerRequest {
  return {
    type: 'offscreen/chunk',
    sessionKey: 'ignored',
    meetingId: 'm1',
    stream: 'TAB',
    startMs: seq * 25_000,
    durationMs: 25_000,
    audio: 'UklGRg==',
  };
}
