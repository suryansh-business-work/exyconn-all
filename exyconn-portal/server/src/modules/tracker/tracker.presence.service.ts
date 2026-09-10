import { TrackerAccessModel } from './models';
import { forbidden } from '../../utils/errors';
import {
  PRESENCE_AWAY_STATUSES,
  TRACKER_MESSAGE_LIMITS,
  type PresenceStatus,
} from './tracker.constants';

/** Statuses that mean "not working right now", as a set — membership is checked per call. */
const AWAY = new Set<string>(PRESENCE_AWAY_STATUSES);

/** Whether this presence means the employee has stepped away from the work. */
export function isAwayPresence(status: string): boolean {
  return AWAY.has(status);
}

/** What either end reads back after a presence has been set or looked up. */
export interface PresenceState {
  status: PresenceStatus;
  note: string;
  /** When it was last stated. Null when the employee has never said anything. */
  since: Date | null;
}

/** Reads a stored access row's presence, filling in the default for rows written before it existed. */
export function presenceOf(access: {
  presence?: string | null;
  presenceNote?: string | null;
  presenceAt?: Date | null;
}): PresenceState {
  return {
    status: (access.presence ?? 'WORKING') as PresenceStatus,
    note: access.presenceNote ?? '',
    since: access.presenceAt ?? null,
  };
}

/**
 * Records what the employee says they are doing.
 *
 * Only ever the CALLER's own row: the resolver hands over the userId the device token
 * authenticated as, so one employee can never put another at lunch. A revoked grant is
 * refused rather than silently ignored — the app signs out on that answer.
 */
export async function setPresence(
  userId: string,
  status: PresenceStatus,
  note?: string | null,
): Promise<PresenceState> {
  const access = await TrackerAccessModel.findOneAndUpdate(
    { userId, isActive: true },
    {
      presence: status,
      presenceNote: (note ?? '').slice(0, TRACKER_MESSAGE_LIMITS.maxTitleChars).trim(),
      presenceAt: new Date(),
    },
    { new: true },
  ).lean();
  if (!access) {
    forbidden('Your tracker access has been revoked.');
  }
  return presenceOf(access);
}
