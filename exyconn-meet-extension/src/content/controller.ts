import type { Logger } from '@exyconn/logger';
import { askWorker } from '../services/messaging';
import { createPrefsStore, parsePrefs, PREFS_KEY } from '../storage/prefs';
import type { MeetReport, StateBroadcast, WorkerState } from '../types/messages';
import type { MeetingState } from '../types/meeting';
import { meetingCodeFromUrl } from '../utils/meet-url';
import { readMeetPage, watchPage } from './meet-adapter';
import { readMeetingTitle } from './meet-adapter/title';
import { logTo } from '../services/logger';

/** True while this content script can still reach its extension (false after an update). */
function extensionAlive(): boolean {
  return chrome.runtime?.id !== undefined;
}

/**
 * Watches the Meet page and reports to the worker. One debounced MutationObserver, no
 * polling; a report is sent only when something the worker cares about changed.
 */
export function startController(logger: Logger): () => void {
  let code = meetingCodeFromUrl(location.href);
  let state: MeetingState = 'PAGE_OPENED';
  let lastReport = '';
  let userTracks = true;
  let orgTracks = false;

  const send = (message: Parameters<typeof askWorker>[0]): void => {
    askWorker(message).catch(logTo(logger, 'The worker did not take a page report'));
  };

  const hello = (meetingCode: string): void => {
    state = 'PAGE_OPENED';
    lastReport = '';
    send({
      type: 'meet/hello',
      page: { meetingCode, url: location.href, title: readMeetingTitle(document, meetingCode) },
    });
  };

  const read = (): void => {
    if (!extensionAlive()) {
      stop();
      return;
    }
    const current = meetingCodeFromUrl(location.href);
    if (current !== code) {
      code = current;
      if (current === null) {
        send({ type: 'meet/gone' });
        return;
      }
      hello(current);
    }
    if (code === null) {
      return;
    }
    const report: MeetReport = readMeetPage(document, {
      meetingCode: code,
      url: location.href,
      previous: state,
      trackParticipants: userTracks && orgTracks,
    });
    state = report.meetingState;
    const serialized = JSON.stringify(report);
    if (serialized !== lastReport) {
      lastReport = serialized;
      send({ type: 'meet/report', report });
    }
  };

  const onPrefs = (changes: Record<string, chrome.storage.StorageChange>, area: string): void => {
    if (area === 'sync' && PREFS_KEY in changes) {
      userTracks = parsePrefs(changes[PREFS_KEY].newValue).participantTracking;
    }
  };
  const onState = (message: unknown): undefined => {
    if (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === 'state/changed'
    ) {
      orgTracks = (message as StateBroadcast).state.auth.org?.participantTracking ?? false;
    }
    return undefined;
  };
  const onLeave = (): void => send({ type: 'meet/gone' });

  askWorker<WorkerState>({ type: 'state/get' })
    .then((current) => {
      orgTracks = current.auth.org?.participantTracking ?? false;
    })
    .catch(logTo(logger, 'Could not read the assistant state'));
  createPrefsStore(chrome.storage.sync)
    .read()
    .then((prefs) => {
      userTracks = prefs.participantTracking;
    })
    .catch(logTo(logger, 'Could not read settings'));
  chrome.storage.onChanged.addListener(onPrefs);
  chrome.runtime.onMessage.addListener(onState);
  globalThis.addEventListener('pagehide', onLeave);
  if (code !== null) {
    hello(code);
  }
  const unwatch = watchPage(document, read);

  function stop(): void {
    unwatch();
    globalThis.removeEventListener('pagehide', onLeave);
    if (extensionAlive()) {
      chrome.storage.onChanged.removeListener(onPrefs);
      chrome.runtime.onMessage.removeListener(onState);
    }
  }
  return stop;
}
