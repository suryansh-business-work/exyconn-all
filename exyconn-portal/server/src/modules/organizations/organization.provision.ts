import type { OrganizationDocument } from './organization.model';
import { AppSettingsModel } from '../admin/settings.model';
import { BrandingModel } from '../branding/branding.model';
import { ensureEmailDefaults } from '../email';
import { ensureOnboardingDefaults } from '../onboarding';
import { ensureSupportSlaPolicies } from '../support';
import { ensureTaxSlabs } from '../payroll';
import { logger } from '../../utils/logger';

/**
 * A new company's day one.
 *
 * Runs INSIDE the organization's own scope (see organizations.service), so every row these
 * write belongs to it: the email templates code sends, the onboarding checklist HR starts
 * from, the support promises a ticket is measured against, a tax table to check against —
 * and its own settings and branding, seeded from what the platform was told about it.
 *
 * Each step is insert-only, so re-running it on an existing company changes nothing it has
 * since edited.
 */
export async function provisionOrganization(organization: OrganizationDocument): Promise<void> {
  await AppSettingsModel.updateOne(
    { key: 'global' },
    {
      $setOnInsert: {
        key: 'global',
        timezone: organization.timezone,
        defaultLocale: organization.locale,
        enabledLocales: [organization.locale],
      },
    },
    { upsert: true },
  );
  await BrandingModel.updateOne(
    { key: 'global' },
    {
      $setOnInsert: {
        key: 'global',
        businessName: organization.name,
        legalName: organization.legalName,
      },
    },
    { upsert: true },
  );
  await ensureEmailDefaults();
  await ensureOnboardingDefaults();
  await ensureSupportSlaPolicies();
  await ensureTaxSlabs();
  logger.info(`Provisioned organization ${organization.name}`);
}
