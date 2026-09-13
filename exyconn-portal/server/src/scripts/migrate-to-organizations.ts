import '../lib/tenant/install';
import mongoose from 'mongoose';
import { database } from '../config/database';
import { PLATFORM_MODELS, ORGANIZATION_FIELD, runAsPlatform } from '../lib/tenant';
import { OrganizationModel } from '../modules/organizations';
import { BrandingModel } from '../modules/branding/branding.model';
import { AppSettingsModel } from '../modules/admin/settings.model';
import { ROLES } from '../constants/roles';
import { UserModel } from '../modules/admin/user.model';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import '../graphql';

/**
 * Moves an install that predates the tenancy into its first organization.
 *
 * Everything already in the database belongs to the one company that has been using it, so
 * this creates that company from what the portal already says about itself (its branding and
 * localisation settings) and stamps every existing record with it. The bootstrap account
 * keeps administering the platform; everybody else becomes a member of that company.
 *
 * Safe to run twice: records that already carry an organization are left alone, and the
 * organization is only created once.
 *
 *   pnpm --filter exyconn-portal-server exec tsx src/scripts/migrate-to-organizations.ts
 */
async function migrate(): Promise<void> {
  await database.connect();

  const branding = await runAsPlatform(() => BrandingModel.findOne({ key: 'global' }).lean());
  const settings = await runAsPlatform(() => AppSettingsModel.findOne({ key: 'global' }).lean());
  const name = branding?.businessName?.trim() || 'Exyconn';

  const organization =
    (await runAsPlatform(() => OrganizationModel.findOne().sort({ createdAt: 1 }))) ??
    (await runAsPlatform(() =>
      OrganizationModel.create({
        name,
        slug: name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/^-|-$/g, ''),
        legalName: branding?.legalName ?? '',
        // What the portal has been running as until now.
        currency: 'INR',
        locale: settings?.defaultLocale ?? 'en',
        timezone: settings?.timezone ?? 'UTC',
        fiscalYearStartMonth: 4,
        contactEmail: branding?.supportEmail ?? '',
      }),
    ));
  logger.info(`Migrating into organization ${organization.name} (${String(organization._id)})`);

  let stamped = 0;
  for (const [modelName, model] of Object.entries(mongoose.models)) {
    if (PLATFORM_MODELS.has(modelName)) {
      continue;
    }
    // Straight to the driver: the models themselves now refuse a write with no organization,
    // and that refusal is exactly what this script exists to satisfy.
    const result = await model.collection.updateMany(
      { [ORGANIZATION_FIELD]: { $exists: false } },
      { $set: { [ORGANIZATION_FIELD]: organization._id } },
    );
    if (result.modifiedCount > 0) {
      logger.info(`  ${modelName}: ${result.modifiedCount}`);
      stamped += result.modifiedCount;
    }
  }
  logger.info(`Stamped ${stamped} records`);

  // The bootstrap account administers the platform as well as this company (the same account
  // ensureAdminAccess keeps alive on every boot).
  await runAsPlatform(() =>
    UserModel.updateOne(
      { email: env.seedAdmin.email.toLowerCase() },
      { $addToSet: { roles: ROLES.SUPER_ADMIN } },
    ),
  );

  // Unique indexes are per organization now, so the old platform-wide ones have to go.
  for (const [modelName, model] of Object.entries(mongoose.models)) {
    try {
      await model.syncIndexes();
    } catch (error) {
      logger.error(error, `Could not rebuild the indexes of ${modelName}`);
    }
  }
  logger.info('Indexes rebuilt');
  await database.disconnect();
}

migrate().catch((error: unknown) => {
  logger.error(error, 'Migration failed');
  process.exit(1);
});
