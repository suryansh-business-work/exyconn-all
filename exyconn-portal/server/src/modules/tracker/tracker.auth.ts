import { createHash } from 'node:crypto';
import type { GraphQLContext } from '../../middleware/auth';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { TrackerAccessModel, TrackerDeviceModel } from './models';
import { unauthenticated, forbidden } from '../../utils/errors';

/** Devices store a SHA-256 of their token, never the token itself. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
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
