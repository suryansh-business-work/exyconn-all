import { createPortalClient } from '@exyconn/tracker-core';
import { secureStore } from './store';

export {
  TrackerAuthError,
  TrackerRejectedError,
  type DeviceInfo,
  type IntervalPayload,
  type LoginResponse,
  type ScreenshotPayload,
  type TrackerMeResponse,
} from '@exyconn/tracker-core';

const PRODUCTION_GRAPHQL_URL = 'https://portal-server.exyconn.com/graphql';
const DEV_GRAPHQL_URL = 'http://localhost:4004/graphql';

/**
 * Portal GraphQL endpoint (main process only). An installed build has no environment
 * variables, so the default MUST be the real portal: defaulting to localhost shipped an
 * installer that could only ever talk to the employee's own machine, and nobody could sign in.
 *
 * electron-vite sets ELECTRON_RENDERER_URL only when serving the dev renderer, so it is the
 * one signal that distinguishes `npm run dev` from a packaged app. An explicit
 * PORTAL_GRAPHQL_URL still wins, for pointing a dev build at staging.
 */
export const PORTAL_GRAPHQL_URL =
  process.env.PORTAL_GRAPHQL_URL ??
  (process.env.ELECTRON_RENDERER_URL ? DEV_GRAPHQL_URL : PRODUCTION_GRAPHQL_URL);

/**
 * The portal, from the MAIN process. Requests originate from Node, not a browser context, so
 * the portal's single-origin CORS never applies. The operations themselves — and how a failure
 * is classified — are `@exyconn/tracker-core`'s, shared with the mobile app; this only says
 * where the portal is and where the device token is kept.
 */
const client = createPortalClient({
  url: PORTAL_GRAPHQL_URL,
  getToken: () => secureStore().getToken(),
});

export const {
  login,
  fetchBranding,
  trackerMe,
  heartbeat,
  fetchMyReport,
  fetchMyDay,
  setTimezone,
  fetchMyTotals,
  fetchTimezones,
  acceptConsent,
  markAttendance,
  startSession,
  stopSession,
  fetchTasks,
  syncIntervals,
  uploadScreenshot,
  fetchManualEntries,
  createManualEntry,
  withdrawManualEntry,
  fetchMessages,
  sendMessage,
  markMessagesRead,
  setPresence,
  reportClientLogs,
} = client;
