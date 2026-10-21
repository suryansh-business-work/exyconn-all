import { API_URL, EXTENSION_VERSION } from '../config';
import { createGraphqlClient } from '../services/api';
import { createAudioUploader } from '../services/audio-upload';
import { createAuth } from '../services/auth';
import { createExtensionLogger } from '../services/logger';
import { createMeetApi } from '../services/meet-api';
import { createLayoutStore } from '../storage/layout';
import { createPrefsStore } from '../storage/prefs';
import { createSessionRegistry } from '../storage/session-registry';
import { createTokenStore } from '../storage/tokens';

const fetchImpl = (input: string, init: RequestInit): Promise<Response> =>
  globalThis.fetch(input, init);

/** The worker's singletons. Created once per worker lifetime; all state lives in storage. */
export const registry = createSessionRegistry(chrome.storage.session);
export const prefsStore = createPrefsStore(chrome.storage.sync);
export const layoutStore = createLayoutStore(chrome.storage.sync);

export const auth = createAuth({
  apiUrl: API_URL,
  fetchImpl,
  store: createTokenStore(chrome.storage.session, chrome.storage.local),
  extensionId: chrome.runtime.id,
  extensionVersion: EXTENSION_VERSION,
  now: Date.now,
});

/** What must be forgotten once the sign-in is gone (org.ts registers the company context). */
const signedOutHooks: Array<() => Promise<void>> = [];
export function onSignedOut(hook: () => Promise<void>): void {
  signedOutHooks.push(hook);
}

const client = createGraphqlClient({
  apiUrl: API_URL,
  fetchImpl,
  getAccessToken: () => auth.getAccessToken(),
  refreshAccessToken: () => auth.refresh(),
  onSignedOut: async () => {
    await Promise.all(signedOutHooks.map((hook) => hook()));
  },
});

export const api = createMeetApi(client);

export const uploadAudio = createAudioUploader({
  apiUrl: API_URL,
  fetchImpl,
  getAccessToken: () => auth.getAccessToken(),
  refreshAccessToken: () => auth.refresh(),
});

/** The worker's own Tech > Logs reporter; other contexts relay their batches through it. */
export const logger = createExtensionLogger('service-worker', (batch) => api.reportLogs(batch));
