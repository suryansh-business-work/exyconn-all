import { NotificationPreferenceModel } from './preference.model';
import { NOTIFICATION_KINDS } from './notification.model';

/** How a kind is delivered to one person. */
export interface NotificationChannels {
  inPortal: boolean;
  email: boolean;
}

/**
 * What somebody gets when they have never said otherwise.
 *
 * In the portal, not by email: a new notification kind must never start mailing people who
 * never asked for mail, and the bell is where this portal's notifications live.
 */
export const DEFAULT_CHANNELS: NotificationChannels = { inPortal: true, email: false };

/** Every kind, with this person's choice or the default. */
export async function readPreferences(employeeId: string) {
  const rows = await NotificationPreferenceModel.find({ employeeId }).lean();
  const byKind = new Map(rows.map((row) => [row.kind, row]));
  return NOTIFICATION_KINDS.map((kind) => {
    const row = byKind.get(kind);
    return {
      kind,
      inPortal: row?.inPortal ?? DEFAULT_CHANNELS.inPortal,
      email: row?.email ?? DEFAULT_CHANNELS.email,
    };
  });
}

/** Records one choice, creating the row the first time it differs from the default. */
export async function setPreference(
  employeeId: string,
  kind: string,
  channels: NotificationChannels,
) {
  await NotificationPreferenceModel.updateOne(
    { employeeId, kind },
    { $set: { inPortal: channels.inPortal, email: channels.email } },
    { upsert: true },
  );
  return readPreferences(employeeId);
}

/**
 * How to deliver one kind to each of these people.
 *
 * One query for the whole batch, because a fan-out to everybody in the company must not
 * become one preference lookup per person.
 */
export async function channelsFor(
  employeeIds: readonly string[],
  kind: string,
): Promise<Map<string, NotificationChannels>> {
  const chosen = await NotificationPreferenceModel.find({
    employeeId: { $in: [...employeeIds] },
    kind,
  }).lean();
  const byEmployee = new Map(chosen.map((row) => [row.employeeId, row]));
  return new Map(
    employeeIds.map((employeeId) => {
      const row = byEmployee.get(employeeId);
      return [
        employeeId,
        {
          inPortal: row?.inPortal ?? DEFAULT_CHANNELS.inPortal,
          email: row?.email ?? DEFAULT_CHANNELS.email,
        },
      ];
    }),
  );
}
