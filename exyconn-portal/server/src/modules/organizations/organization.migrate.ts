import mongoose from 'mongoose';
import { OrganizationModel } from './organization.model';
import { UserModel } from '../admin/user.model';
import { BrandingModel } from '../branding/branding.model';
import { AppSettingsModel } from '../admin/settings.model';
import { ORGANIZATION_FIELD, PLATFORM_MODELS, runAsPlatform } from '../../lib/tenant';
import { ROLES } from '../../constants/roles';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

/** What the install ran as before it had companies: the workspace's own defaults. */
const LEGACY_CURRENCY = 'INR';
const LEGACY_FISCAL_YEAR_START = 4;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '');
}

/**
 * Moves an install that predates the tenancy into its first organization.
 *
 * Everything already in the database belongs to the one company that has been using it, so the
 * company is created from what the portal already says about itself and every existing record
 * is stamped with it. Runs at boot, before anything serves a request: until it has, those
 * records carry no organization and would be invisible to the very company they belong to.
 *
 * Does nothing once any organization exists, so it costs one count on every later boot.
 */
export async function migrateLegacyDataIntoFirstOrganization(): Promise<void> {
  const organizations = await runAsPlatform(() => OrganizationModel.countDocuments());
  if (organizations > 0) {
    return;
  }
  const people = await runAsPlatform(() => UserModel.countDocuments());
  if (people === 0) {
    // A fresh install: there is nothing to migrate, and the first company is created in Admin.
    return;
  }

  const branding = await runAsPlatform(() => BrandingModel.findOne({ key: 'global' }).lean());
  const settings = await runAsPlatform(() => AppSettingsModel.findOne({ key: 'global' }).lean());
  const name = branding?.businessName?.trim() || 'Exyconn';

  const organization = await runAsPlatform(() =>
    OrganizationModel.create({
      name,
      slug: slugify(name),
      legalName: branding?.legalName ?? '',
      currency: LEGACY_CURRENCY,
      locale: settings?.defaultLocale ?? 'en',
      timezone: settings?.timezone ?? 'UTC',
      fiscalYearStartMonth: LEGACY_FISCAL_YEAR_START,
      taxSystem: 'INDIA_GST',
      contactEmail: branding?.supportEmail ?? '',
    }),
  );
  logger.warn(`Migrating this install into its first organization: ${name}`);

  let stamped = 0;
  for (const [modelName, model] of Object.entries(mongoose.models)) {
    if (PLATFORM_MODELS.has(modelName)) {
      continue;
    }
    // Straight to the driver: the models themselves now refuse a write with no organization,
    // and that refusal is exactly what this is satisfying.
    const result = await model.collection.updateMany(
      { [ORGANIZATION_FIELD]: { $exists: false } },
      { $set: { [ORGANIZATION_FIELD]: organization._id } },
    );
    stamped += result.modifiedCount;
  }

  // The bootstrap account administers the platform as well as this company.
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
  logger.warn(`Migrated ${stamped} records into ${name}, and rebuilt the indexes`);
}
