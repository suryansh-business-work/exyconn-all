import { AssetModel } from '../assets/asset.model';
import { LicenceModel } from '../assets/licence.model';
import { ItCloudResourceModel } from './models';
import { getItSettings } from './settings';
import { registerReminderSource, dayKey, daysFromNow, daysUntil, dueInWords } from '../reminders';
import { ROLES } from '../../constants/roles';
import type { Reminder } from '../reminders';

/**
 * The three dates IT already configured a warning period for, and nothing ever warned about.
 *
 * `warrantyWarningDays`, `renewalWarningDays` and `certificateWarningDays` have been on the
 * IT settings form since the register was built. They were read by a dashboard tile, which
 * only says something to whoever happens to open the dashboard: a certificate expires at the
 * weekend either way.
 */

/** Kit whose warranty runs out inside the window IT chose. */
async function warrantiesEnding(now: Date, days: number): Promise<Reminder[]> {
  const rows = await AssetModel.find({
    status: { $nin: ['RETIRED', 'LOST'] },
    warrantyExpiry: { $ne: null, $lte: daysFromNow(now, days) },
  })
    .select('assetTag name warrantyExpiry assignedToName')
    .lean();

  return rows.map((asset) => ({
    dedupeKey: `asset-warranty:${String(asset._id)}:${dayKey(now)}`,
    kind: 'IT',
    title: `${asset.assetTag} is out of warranty ${dueInWords(daysUntil(now, asset.warrantyExpiry as Date))}`,
    body: `${asset.name}${asset.assignedToName ? `, with ${asset.assignedToName}` : ''}. Decide whether to extend the cover, replace it or accept the risk.`,
    link: `/it/assets/${String(asset._id)}`,
    roles: [ROLES.IT],
  }));
}

/** Subscriptions coming up for renewal, which is when the seat count is worth re-reading. */
async function licencesRenewing(now: Date, days: number): Promise<Reminder[]> {
  const rows = await LicenceModel.find({
    status: 'ACTIVE',
    renewalDate: { $lte: daysFromNow(now, days) },
  })
    .select('name vendor renewalDate seatsTotal assigneeIds')
    .lean();

  return rows.map((licence) => {
    const used = licence.assigneeIds?.length ?? 0;
    const spare = (licence.seatsTotal ?? 0) - used;
    const seats =
      spare > 0 ? `${spare} of ${licence.seatsTotal} seats are unused` : 'every seat is in use';
    return {
      dedupeKey: `licence-renewal:${String(licence._id)}:${dayKey(now)}`,
      kind: 'IT',
      title: `${licence.name} renews ${dueInWords(daysUntil(now, licence.renewalDate))}`,
      body: `${licence.vendor ? `${licence.vendor}. ` : ''}${seats} — reclaim what nobody needs before it is paid for again.`,
      link: '/it/licences',
      roles: [ROLES.IT],
    };
  });
}

/** Domains and certificates about to lapse, which is the one that takes a site down. */
async function certificatesExpiring(now: Date, days: number): Promise<Reminder[]> {
  const rows = await ItCloudResourceModel.find({
    status: { $ne: 'RETIRED' },
    expiresAt: { $ne: null, $lte: daysFromNow(now, days) },
  })
    .select('name kind environment expiresAt')
    .lean();

  return rows.map((resource) => ({
    dedupeKey: `cloud-expiry:${String(resource._id)}:${dayKey(now)}`,
    kind: 'IT',
    title: `${resource.name} expires ${dueInWords(daysUntil(now, resource.expiresAt as Date))}`,
    body: `${resource.kind} in ${resource.environment}. A lapsed certificate or domain takes the service with it.`,
    link: '/it/cloud',
    roles: [ROLES.IT],
  }));
}

registerReminderSource({
  key: 'it-expiry',
  label: 'IT warranties, renewals and certificates',
  async due(now) {
    const settings = await getItSettings();
    const [warranties, licences, certificates] = await Promise.all([
      warrantiesEnding(now, settings.warrantyWarningDays),
      licencesRenewing(now, settings.renewalWarningDays),
      certificatesExpiring(now, settings.certificateWarningDays),
    ]);
    return [...warranties, ...licences, ...certificates];
  },
});
