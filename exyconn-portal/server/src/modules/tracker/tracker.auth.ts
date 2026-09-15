import { createHash } from 'node:crypto';
import { Kind, parse, type DocumentNode } from 'graphql';
import type { GraphQLContext } from '../../middleware/auth';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { TrackerAccessModel, TrackerDeviceModel } from './models';
import { unauthenticated, forbidden } from '../../utils/errors';
import { runAsPlatform } from '../../lib/tenant';

/** Devices store a SHA-256 of their token, never the token itself. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Every root field the desktop and phone trackers call (packages/tracker-core operations).
 *
 * A device token never expires and sits on a laptop or a phone, so it is not allowed to be a
 * general portal session: a request carrying one may only run these. Adding an operation to
 * tracker-core means adding its root field here, or the app is signed out when it calls it.
 */
const TRACKER_DEVICE_FIELDS: ReadonlySet<string> = new Set([
  '__typename',
  'createTrackerManualEntry',
  'localeBundle',
  'markMyTrackerMessagesRead',
  'myTrackerCalendar',
  'myTrackerDay',
  'myTrackerManualEntries',
  'myTrackerMessages',
  'myTrackerTotals',
  'publicBranding',
  'reportClientLogs',
  'sendMyTrackerMessage',
  'setMyTrackerPresence',
  'trackerAcceptConsent',
  'trackerHeartbeat',
  'trackerLatestRelease',
  'trackerLogin',
  'trackerMarkAttendance',
  'trackerMe',
  'trackerSetTimezone',
  'trackerStartSession',
  'trackerStopSession',
  'trackerSyncIntervals',
  'trackerTaskOptions',
  'trackerTimezones',
  'trackerUploadScreenshot',
  'translateMissing',
  'withdrawTrackerManualEntry',
]);

/** The document a request carries, or null when it has none that parses. */
function parseDocument(query: unknown): DocumentNode | null {
  if (typeof query !== 'string') {
    return null;
  }
  try {
    return parse(query);
  } catch {
    return null;
  }
}

/**
 * Whether a GraphQL request may run on a device token: every operation in it selects only
 * tracker root fields, named directly (a fragment at the root could hide any field). A request
 * with no readable document — a batch, a persisted-query hash — is refused.
 */
export function deviceMayRun(query: unknown): boolean {
  const document = parseDocument(query);
  if (!document) {
    return false;
  }
  return document.definitions.every((definition) => {
    if (definition.kind !== Kind.OPERATION_DEFINITION) {
      return true;
    }
    return definition.selectionSet.selections.every(
      (selection) =>
        selection.kind === Kind.FIELD && TRACKER_DEVICE_FIELDS.has(selection.name.value),
    );
  });
}

/**
 * Whether a device token is still the live credential of its device: the row exists, belongs
 * to the token's user, has not been revoked, and holds THIS token's hash — so a token replaced
 * by a later sign-in on the same device stops working too. Read as the platform, because the
 * question is asked while the request is still working out who is calling.
 */
export async function deviceTokenIsLive(
  userId: string,
  deviceId: string,
  token: string,
): Promise<boolean> {
  const device = await runAsPlatform(() =>
    TrackerDeviceModel.findOne({ deviceId, userId }).select('isActive revokedAt tokenHash').lean(),
  );
  return Boolean(device?.isActive && !device.revokedAt && device.tokenHash === hashToken(token));
}

export interface TrackerDeviceContext {
  userId: string;
  deviceId: string;
}

/**
 * Authenticates a call from the desktop tracker.
 *
 * The device token deliberately has no expiry, so this is the ONLY thing standing between
 * a stolen laptop and an open session. It re-checks, on every single call, that:
 *   1. the token is a device token (carries a deviceId),
 *   2. the device row still exists and has not been revoked,
 *   3. the employee's tracker access grant is still active.
 * Revoking either the device or the grant cuts the client off on its next request.
 */
export async function assertTrackerDevice(ctx: GraphQLContext): Promise<TrackerDeviceContext> {
  const deviceId = ctx.user?.deviceId;
  const userId = ctx.user?.id;

  if (!deviceId || !userId) {
    unauthenticated('Device authentication required');
  }

  const device = await TrackerDeviceModel.findOne({ deviceId, userId }).lean();
  if (!device || !device.isActive || device.revokedAt) {
    unauthenticated('This device has been revoked. Please sign in again.');
  }

  const access = await TrackerAccessModel.findOne({ userId }).lean();
  if (!access?.isActive) {
    forbidden('Your tracker access has been revoked.');
  }

  return { userId, deviceId };
}

/**
 * The employee behind a call, whether it arrived on a portal session or a device token.
 *
 * Off-computer time can be claimed from either place, and a device token must not be the
 * cheaper way in: a call carrying one goes through the full device check, so a revoked
 * laptop cannot file a claim any more than it can upload a screenshot.
 */
export async function assertEmployee(ctx: GraphQLContext): Promise<{ id: string }> {
  if (ctx.user?.deviceId) {
    const { userId } = await assertTrackerDevice(ctx);
    return { id: userId };
  }
  return assertAuthenticated(ctx);
}
