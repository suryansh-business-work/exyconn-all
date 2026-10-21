import type { OffscreenReport, WorkerReply, WorkerRequest } from '../types/messages';
import { signIn, signOut } from './auth-flow';
import {
  handleOffscreenReport,
  pauseCapture,
  recordConsent,
  resumeCapture,
  startCapture,
  stopCapture,
} from './capture';
import { handleGone, handleHello, handleReport } from './meeting';
import { getMessages } from './org';
import { handlePanelRequest } from './panel';
import { applyReminderChoice } from './reminders';
import { api, logger, registry } from './services';
import { stateFor } from './state';
import { errorText } from '../utils/errors';

const OFFSCREEN_URL = chrome.runtime.getURL('offscreen.html');

/**
 * The tab a request is about. A content script may only speak for its own tab, whatever it
 * claims; the popup and options pages name the tab they mean.
 */
function targetTab(request: WorkerRequest, sender: chrome.runtime.MessageSender): number | null {
  if (sender.tab?.id !== undefined) {
    return sender.tab.id;
  }
  return 'tabId' in request && typeof request.tabId === 'number' ? request.tabId : null;
}

function requireTab(tabId: number | null): number {
  if (tabId === null) {
    throw new Error('Open a Google Meet call first');
  }
  return tabId;
}

function isOffscreenReport(request: WorkerRequest): request is OffscreenReport {
  return request.type.startsWith('offscreen/');
}

function handleTabRequest(request: WorkerRequest, tabId: number | null): Promise<unknown> {
  switch (request.type) {
    case 'meet/hello':
      return handleHello(requireTab(tabId), request.page);
    case 'meet/report':
      return handleReport(requireTab(tabId), request.report);
    case 'meet/gone':
      return handleGone(requireTab(tabId));
    case 'capture/start':
      return startCapture(requireTab(tabId));
    case 'capture/consent':
      return recordConsent(requireTab(tabId));
    case 'capture/pause':
      return pauseCapture(requireTab(tabId));
    case 'capture/resume':
      return resumeCapture(requireTab(tabId));
    case 'capture/stop':
      return stopCapture(requireTab(tabId), null);
    case 'reminder/action':
      return applyReminderChoice(requireTab(tabId), request.action);
    case 'panel/request':
      return handlePanelRequest(requireTab(tabId), request.request);
    default:
      return Promise.resolve(undefined);
  }
}

async function handle(
  request: WorkerRequest,
  sender: chrome.runtime.MessageSender,
): Promise<unknown> {
  const tabId = targetTab(request, sender);
  if (isOffscreenReport(request)) {
    if (sender.url !== OFFSCREEN_URL) {
      throw new Error('Refused: not from the recorder');
    }
    return handleOffscreenReport(request);
  }
  switch (request.type) {
    case 'state/get':
      return stateFor(tabId === null || (await registry.get(tabId)) === null ? null : tabId);
    case 'auth/sign-in':
      return signIn();
    case 'auth/sign-out':
      return signOut();
    case 'log/batch':
      return api.reportLogs(request.batch);
    case 'i18n/messages':
      return getMessages();
    case 'options/open':
      return chrome.runtime.openOptionsPage();
    default:
      return handleTabRequest(request, tabId);
  }
}

/** True for a message meant for the worker (not a broadcast or an offscreen command). */
function isWorkerRequest(message: unknown): message is WorkerRequest {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    !('target' in message) &&
    message.type !== 'state/changed'
  );
}

/** The single `runtime.onMessage` listener. Every reply is `{ ok, data | error }`. */
export function onMessage(
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (reply: WorkerReply<unknown>) => void,
): boolean {
  if (sender.id !== chrome.runtime.id || !isWorkerRequest(message)) {
    return false;
  }
  handle(message, sender)
    .then((data) => sendResponse({ ok: true, data: data ?? null }))
    .catch((error: unknown) => {
      const text = errorText(error, 'Something went wrong');
      logger.warn('A request to the extension failed', error, { type: message.type });
      sendResponse({ ok: false, error: text });
    });
  return true;
}
