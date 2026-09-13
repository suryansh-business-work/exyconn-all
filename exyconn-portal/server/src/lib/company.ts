import { OrganizationModel, type TaxSystem } from '../modules/organizations/organization.model';
import { currentOrganizationId, runAsPlatform } from './tenant';
import { TenantScopeError } from './tenant';

/** What a company writes its paperwork in, and whose tax rules it follows. */
export interface CompanyProfile {
  /** ISO 4217. */
  currency: string;
  /** BCP 47 — the language a document is set in when nobody in particular is reading it. */
  locale: string;
  /** IANA. */
  timezone: string;
  /** ISO 3166-1 alpha-2, or empty. */
  country: string;
  fiscalYearStartMonth: number;
  taxSystem: TaxSystem;
}

/**
 * The company in scope, as everything that renders money or a document needs it.
 *
 * Read rather than assumed: an invoice, a payslip and a summary each used to be written in
 * Indian notation because that was hardcoded. They are now written in the company's own.
 */
export async function companyProfile(): Promise<CompanyProfile> {
  const organizationId = currentOrganizationId();
  if (organizationId === null) {
    throw new TenantScopeError('Reading the company profile');
  }
  const organization = await runAsPlatform(() =>
    OrganizationModel.findById(organizationId)
      .select('currency locale timezone country fiscalYearStartMonth taxSystem')
      .lean(),
  );
  if (!organization) {
    throw new TenantScopeError('Reading the company profile');
  }
  return {
    currency: organization.currency,
    locale: organization.locale,
    timezone: organization.timezone,
    country: organization.country ?? '',
    fiscalYearStartMonth: organization.fiscalYearStartMonth,
    taxSystem: organization.taxSystem,
  };
}

/** Whether this company's paperwork follows India's rules (GST, PF, ESI, income-tax slabs). */
export function followsIndianTaxRules(profile: CompanyProfile): boolean {
  return profile.taxSystem === 'INDIA_GST';
}
