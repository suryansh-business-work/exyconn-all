import { randomBytes } from 'node:crypto';
import type { Role } from '../../constants/roles';
import { organizationOf, runAsPlatform, runForOrganization } from '../../lib/tenant';
import { hashPassword } from '../../utils/password';
import { logger } from '../../utils/logger';
import { UserModel } from '../admin/user.model';
import { OrganizationModel } from './organization.model';
import { organizationService } from './organizations.service';

/** A company a public demo runs in, and the one account the demo acts as inside it. */
export interface DemoOrganizationSpec {
  slug: string;
  name: string;
  industry: string;
  description: string;
  currency: string;
  country: string;
  timezone: string;
  /** The demo's own account. It never signs in: nobody knows its password. */
  account: { name: string; email: string; roles: Role[] };
}

/** Where a demo runs: its company and the account it acts as. */
export interface DemoOrganization {
  organizationId: string;
  accountId: string;
}

/** The demo's company, created (and provisioned like any other) the first time. */
async function demoCompanyId(spec: DemoOrganizationSpec): Promise<string> {
  const existing = await runAsPlatform(() =>
    OrganizationModel.findOne({ slug: spec.slug }).select('_id').lean(),
  );
  if (existing) {
    return String(existing._id);
  }
  const created = await organizationService.create({
    name: spec.name,
    slug: spec.slug,
    industry: spec.industry,
    description: spec.description,
    currency: spec.currency,
    country: spec.country,
    timezone: spec.timezone,
  });
  logger.info(`Created the demo company ${spec.name}`);
  return String(created._id);
}

/**
 * The demo's account in its company. Created directly rather than through Admin > Users, so no
 * welcome email goes to its address (an `.example` one) and no password exists to share.
 */
async function demoAccountId(spec: DemoOrganizationSpec, organizationId: string) {
  const email = spec.account.email.toLowerCase();
  const existing = await runAsPlatform(() => UserModel.findOne({ email }).lean());
  if (existing) {
    if (organizationOf(existing) !== organizationId) {
      throw new Error(`The demo account ${email} belongs to another company.`);
    }
    return String(existing._id);
  }
  const passwordHash = await hashPassword(randomBytes(32).toString('base64url'));
  const created = await runForOrganization(organizationId, () =>
    UserModel.create({
      name: spec.account.name,
      email,
      passwordHash,
      roles: spec.account.roles,
      emailVerifiedAt: new Date(),
    }),
  );
  return String(created._id);
}

/**
 * The company and account a public demo runs as, created on first use (boot creates them) and
 * read by their handle and address after that, so a company removed by an operator is simply
 * made again. Every demo record is that company's own data, so the tenancy keeps it apart from
 * every real customer.
 */
export async function ensureDemoOrganization(
  spec: DemoOrganizationSpec,
): Promise<DemoOrganization> {
  const organizationId = await demoCompanyId(spec);
  const accountId = await demoAccountId(spec, organizationId);
  return { organizationId, accountId };
}
