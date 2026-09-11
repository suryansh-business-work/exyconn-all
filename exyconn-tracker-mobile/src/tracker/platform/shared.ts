import {
  createPortalClient,
  Outbox,
  type EngineDeps,
  type InputCounter,
  type TrackerSettings,
} from '@exyconn/tracker-core';
import { PORTAL_GRAPHQL_URL } from '../config';
import { documentFile, documentImages } from '../json-file';
import { mobileStore } from '../store';

/** The portal, with this phone's device token. */
export const portal = createPortalClient({
  url: PORTAL_GRAPHQL_URL,
  getToken: () => mobileStore().getToken(),
});

/**
 * A phone cannot see a key press or a tap outside its own app, so it counts nothing and says so.
 * Reporting zeros is honest; the UI labels them "not available on a phone" rather than "0".
 */
export const noInputCounter: InputCounter = {
  start: () => undefined,
  stop: () => undefined,
  peek: () => ({ keys: 0, clicks: 0 }),
  drain: () => ({ keys: 0, clicks: 0 }),
};

/** What a platform adapter is told about the running app. */
export interface PlatformContext {
  /** The workspace settings in force now — they change under a running engine. */
  settings: () => TrackerSettings;
  /** The screen-capture session ended while tracking; the app pauses and says why. */
  onCaptureLost: () => void;
}

/** The parts every platform shares: the portal and the durable outbox in the documents dir. */
export function baseDeps(): Pick<EngineDeps, 'portal' | 'outbox' | 'input'> {
  return {
    portal,
    outbox: new Outbox(
      documentFile('tracker-outbox.json'),
      documentImages('tracker-outbox-images'),
    ),
    input: noInputCounter,
  };
}
