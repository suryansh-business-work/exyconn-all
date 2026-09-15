import { OrganizationModel } from './organization.model';
import { runAsPlatform } from '../../lib/tenant';
import { invalidatePlatformOperatorCache } from '../../lib/platformAccess';
import { logger } from '../../utils/logger';

/**
 * Makes sure the platform has exactly one operator organization.
 *
 * Exyconn's own staff work inside an ordinary company — the first one, which the legacy
 * migration created from the install that predates the tenancy. That company is flagged as the
 * operator so its TECH, WEBSITE and ADMIN people keep managing what every company shares
 * (lib/platformAccess), while the same roles in any customer company cannot.
 *
 * Runs at boot. Does nothing when one is already flagged, never flags a second, and on a fresh
 * install with no company yet it waits for a later boot.
 */
export async function ensurePlatformOperatorOrganization(): Promise<void> {
  const flagged = await runAsPlatform(() => OrganizationModel.exists({ isPlatformOperator: true }));
  if (flagged) {
    return;
  }
  const oldest = await runAsPlatform(() =>
    OrganizationModel.findOne().sort({ createdAt: 1, _id: 1 }).select('_id name').lean(),
  );
  if (!oldest) {
    return;
  }
  // Two instances booting together both pick this same oldest company, so a race still flags one.
  const result = await runAsPlatform(() =>
    OrganizationModel.updateOne(
      { _id: oldest._id, isPlatformOperator: { $ne: true } },
      { $set: { isPlatformOperator: true } },
    ),
  );
  invalidatePlatformOperatorCache();
  if (result.modifiedCount > 0) {
    logger.warn(`Flagged ${oldest.name} (${String(oldest._id)}) as the platform operator`);
  }
}
