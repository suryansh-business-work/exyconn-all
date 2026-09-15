import { OrganizationModel, type OrganizationStatus, type TaxSystem } from './organization.model';
import { UserModel } from '../admin/user.model';
import { ROLES, type Role } from '../../constants/roles';
import { badRequest, notFound } from '../../utils/errors';
import { isValidCountry, isValidCurrency } from '../../utils/iso';
import { isValidTimezone } from '../../utils/timezone';
import { canonicalLocale } from '../i18n/locale.constants';
import {
  organizationOf,
  runAsPlatform,
  runForOrganization,
  setOrganizationOf,
} from '../../lib/tenant';
import { provisionOrganization } from './organization.provision';
import { adminService } from '../admin/admin.service';
import { logger } from '../../utils/logger';

export interface OrganizationInput {
  name: string;
  slug?: string;
  legalName?: string;
  country?: string;
  currency: string;
  locale?: string;
  timezone?: string;
  fiscalYearStartMonth?: number;
  taxSystem?: TaxSystem;
  contactEmail?: string;
}

export interface OrganizationAdminInput {
  name: string;
  email: string;
}

/** "Acme Manufacturing Ltd" -> "acme-manufacturing-ltd". */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '');
}

/** Every field is checked against its standard, so a company cannot be filed under "XX". */
function validate(input: Partial<OrganizationInput>): void {
  if (input.currency !== undefined && !isValidCurrency(input.currency.toUpperCase())) {
    badRequest(`"${input.currency}" is not an ISO 4217 currency code.`);
  }
  if (
    input.country !== undefined &&
    input.country !== '' &&
    !isValidCountry(input.country.toUpperCase())
  ) {
    badRequest(`"${input.country}" is not an ISO 3166-1 country code.`);
  }
  if (input.timezone !== undefined && !isValidTimezone(input.timezone)) {
    badRequest(`"${input.timezone}" is not a timezone this system knows.`);
  }
  if (input.locale !== undefined && canonicalLocale(input.locale) === null) {
    badRequest(`"${input.locale}" is not a language tag this system knows.`);
  }
}

/**
 * The organizations on this platform, and the people who administer them.
 *
 * Everything here runs as the platform (across organizations) — it is the one console above
 * the tenancy. Creating a company also provisions it: its defaults, templates and policies
 * are written INSIDE its own scope, so day one looks like every other company's day one.
 */
class OrganizationService {
  list() {
    return runAsPlatform(() => OrganizationModel.find().sort({ name: 1 }).lean());
  }

  async get(id: string) {
    const organization = await runAsPlatform(() => OrganizationModel.findById(id).lean());
    if (!organization) notFound('Organization');
    return organization;
  }

  async create(input: OrganizationInput) {
    validate(input);
    const slug = slugify(input.slug ?? input.name);
    if (slug === '') badRequest('An organization needs a name that makes a handle.');
    const taken = await runAsPlatform(() => OrganizationModel.findOne({ slug }).lean());
    if (taken) badRequest(`The handle "${slug}" is already taken by another organization.`);

    const organization = await runAsPlatform(() =>
      OrganizationModel.create({
        ...input,
        slug,
        currency: input.currency.toUpperCase(),
        country: (input.country ?? '').toUpperCase(),
        locale: canonicalLocale(input.locale ?? 'en') ?? 'en',
      }),
    );
    // Its own defaults, written as the company rather than as the platform.
    await runForOrganization(String(organization._id), () => provisionOrganization(organization));
    logger.info(`Created organization ${organization.name} (${slug})`);
    return organization.toObject();
  }

  async update(id: string, input: Partial<OrganizationInput>) {
    validate(input);
    const organization = await runAsPlatform(() =>
      OrganizationModel.findByIdAndUpdate(id, input, { new: true }).lean(),
    );
    if (!organization) notFound('Organization');
    return organization;
  }

  /** Suspending keeps every record and stops every sign-in (see auth.service). */
  async setStatus(id: string, status: OrganizationStatus) {
    const organization = await runAsPlatform(() =>
      OrganizationModel.findByIdAndUpdate(id, { status }, { new: true }).lean(),
    );
    if (!organization) notFound('Organization');
    return organization;
  }

  /**
   * Appoints a company's administrator: the one account the platform creates inside a
   * company, which then administers it without the platform's help. An existing account
   * already in that company is promoted instead of duplicated.
   */
  async assignAdmin(organizationId: string, input: OrganizationAdminInput) {
    // Refuses up front if there is no such company.
    await this.get(organizationId);
    const email = input.email.toLowerCase().trim();
    const existing = await runAsPlatform(() => UserModel.findOne({ email }));

    if (existing) {
      const belongsTo = organizationOf(existing);
      if (belongsTo !== null && belongsTo !== organizationId) {
        badRequest('That email already belongs to somebody in another organization.');
      }
      // A platform administrator stands above every company; moving that account into one
      // would hand a company's staff an account that administers the whole platform.
      if (belongsTo === null && existing.roles.includes(ROLES.SUPER_ADMIN)) {
        badRequest('That email belongs to a platform administrator, who cannot join a company.');
      }
      existing.roles = [...new Set([...existing.roles, ROLES.ADMIN])] as Role[];
      setOrganizationOf(existing, organizationId);
      existing.isActive = true;
      existing.isBlocked = false;
      await runAsPlatform(() => existing.save());
      return existing.toObject();
    }

    // The same path Admin > Users takes — one way to create a person, inside their company.
    const created = await runForOrganization(organizationId, () =>
      adminService.createUser({ name: input.name, email, roles: [ROLES.ADMIN] }),
    );
    return created.user.toObject();
  }
}

export const organizationService = new OrganizationService();
