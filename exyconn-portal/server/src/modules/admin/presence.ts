import { UserModel } from './user.model';
import { runAsPlatform } from '../../lib/tenant';
import { logger } from '../../utils/logger';

/** Somebody who used a portal or app this recently is shown as online. */
export const ONLINE_WINDOW_MS = 5 * 60 * 1000;
/** At most one activity write per person per this long — a page load fires many requests. */
const TOUCH_INTERVAL_MS = 60 * 1000;

const lastTouched = new Map<string, number>();

/** Test seam: forgets when each person was last written. */
export function resetPresenceThrottle(): void {
  lastTouched.clear();
}

/**
 * Notes that a signed-in person just used the API. Throttled per person, and never awaited by
 * the request: a missed write only makes someone look offline for a minute.
 */
export function recordActivity(userId: string, now = Date.now()): Promise<void> {
  const previous = lastTouched.get(userId);
  if (previous !== undefined && now - previous < TOUCH_INTERVAL_MS) {
    return Promise.resolve();
  }
  lastTouched.set(userId, now);
  return runAsPlatform(() =>
    UserModel.updateOne({ _id: userId }, { $set: { lastActiveAt: new Date(now) } }),
  )
    .then(() => undefined)
    .catch((error: unknown) => {
      logger.warn({ err: error, userId }, 'Could not record user activity');
    });
}

/** Online means active within the last few minutes. */
export function isOnline(lastActiveAt: Date | null | undefined, now = Date.now()): boolean {
  return lastActiveAt instanceof Date && now - lastActiveAt.getTime() < ONLINE_WINDOW_MS;
}

export const presenceResolvers = {
  User: {
    isOnline: (parent: { lastActiveAt?: Date | null }) => isOnline(parent.lastActiveAt),
  },
};
