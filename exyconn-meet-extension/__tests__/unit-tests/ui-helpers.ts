import { vi } from 'vitest';
import type { Logger } from '@exyconn/logger';
import type { TabSnapshot, WorkerState } from '../../src/types/messages';
import { installChrome, type ChromeMock } from './chrome-mock';
import { ORG } from './fake-portal';

/** A logger whose calls a test can inspect. */
export function testLogger() {
  const calls = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), capture: vi.fn() };
  const logger: Logger = {
    ...calls,
    debug: vi.fn(),
    breadcrumb: vi.fn(),
    setRoute: vi.fn(),
    flush: () => Promise.resolve(),
  };
  return { ...calls, ...logger };
}

export const TAB_SNAPSHOT: TabSnapshot = {
  tabId: 7,
  meetingCode: 'abc-defg-hij',
  meetingId: 'm1',
  meetingState: 'IN_MEETING',
  transcriptionState: 'ON',
  captureState: 'IDLE',
  captureError: null,
  consentRecorded: true,
  micEnabled: false,
  pendingUploads: 0,
  participantCount: 2,
  captureElsewhere: false,
  reminderBanner: false,
  iconStatus: 'IDLE',
};

export const SIGNED_IN: WorkerState = { auth: { signedIn: true, org: ORG }, tab: TAB_SNAPSHOT };
export const SIGNED_OUT: WorkerState = { auth: { signedIn: false, org: null }, tab: null };

type Answer = unknown | ((message: Record<string, unknown>) => unknown);

/**
 * Installs the fake chrome with a worker that answers by message type (or by panel op).
 * An answer that is an Error becomes `{ ok: false, error }`.
 */
export function workerAnswering(given: Record<string, Answer>): ChromeMock {
  const answers: Record<string, Answer> = { 'i18n/messages': {}, ...given };
  const chrome = installChrome();
  chrome.runtime.sendMessage.mockImplementation((raw: unknown) => {
    const message = raw as Record<string, unknown>;
    const request = message.request as Record<string, unknown> | undefined;
    const key = request === undefined ? String(message.type) : `panel:${String(request.op)}`;
    if (!(key in answers)) {
      return Promise.resolve({ ok: true, data: null });
    }
    const answer = answers[key];
    const data =
      typeof answer === 'function'
        ? (answer as (m: Record<string, unknown>) => unknown)(message)
        : answer;
    return Promise.resolve(
      data instanceof Error ? { ok: false, error: data.message } : { ok: true, data },
    );
  });
  return chrome;
}

/** jsdom lacks matchMedia and pointer capture; the UI uses both. */
export function installBrowserGaps(dark = false): { setDark: (value: boolean) => void } {
  const listeners = new Set<(event: { matches: boolean }) => void>();
  vi.stubGlobal('matchMedia', () => ({
    matches: dark,
    addEventListener: (_: string, listener: (event: { matches: boolean }) => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: (event: { matches: boolean }) => void) =>
      listeners.delete(listener),
  }));
  HTMLElement.prototype.setPointerCapture = vi.fn();
  return { setDark: (value) => listeners.forEach((listener) => listener({ matches: value })) };
}
