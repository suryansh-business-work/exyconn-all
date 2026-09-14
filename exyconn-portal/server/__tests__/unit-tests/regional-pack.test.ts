import { OrganizationModel, organizationService } from '../../src/modules/organizations';
import { companyProfile, followsIndianTaxRules } from '../../src/lib/company';
import { readPayrollSettings } from '../../src/modules/payroll';
import { ensureTaxSlabs } from '../../src/modules/payroll/tax-slab.seed';
import { TaxRegimeModel } from '../../src/modules/payroll/tax-slab.model';
import { runForOrganization } from '../../src/lib/tenant';

/**
 * India's GST, PF, ESI and income-tax slabs used to be what the portal WAS. They are now one
 * regional pack a company opts into, and everything else — money, language, the month the
 * financial year opens — is the company's own.
 */
async function company(fields: Record<string, unknown>): Promise<string> {
  const created = await organizationService.create({
    name: `Co ${Math.random().toString(36).slice(2, 8)}`,
    currency: 'USD',
    ...fields,
  } as Parameters<typeof organizationService.create>[0]);
  return String(created._id);
}

describe('the company a record belongs to', () => {
  it('says what its money, language and financial year are', async () => {
    const id = await company({
      currency: 'EUR',
      locale: 'de-DE',
      timezone: 'Europe/Berlin',
      country: 'DE',
      fiscalYearStartMonth: 1,
    });

    const profile = await runForOrganization(id, companyProfile);

    expect(profile).toMatchObject({
      currency: 'EUR',
      locale: 'de-DE',
      timezone: 'Europe/Berlin',
      country: 'DE',
      fiscalYearStartMonth: 1,
      taxSystem: 'NONE',
    });
    expect(followsIndianTaxRules(profile)).toBe(false);
  });

  it('follows India rules only when it was set up to', async () => {
    const indian = await company({ currency: 'INR', taxSystem: 'INDIA_GST' });
    const german = await company({ currency: 'EUR', taxSystem: 'VAT' });

    expect(followsIndianTaxRules(await runForOrganization(indian, companyProfile))).toBe(true);
    expect(followsIndianTaxRules(await runForOrganization(german, companyProfile))).toBe(false);
  });
});

describe('statutory deductions', () => {
  it('withholds PF, ESI and professional tax for a company under India rules', async () => {
    const id = await company({ currency: 'INR', taxSystem: 'INDIA_GST', fiscalYearStartMonth: 4 });

    const settings = await runForOrganization(id, readPayrollSettings);

    expect(settings).toMatchObject({
      pfEnabled: true,
      esiEnabled: true,
      professionalTaxMonthly: 200,
      financialYearStartMonth: 4,
    });
  });

  it('withholds none of them for a company that pays under any other system', async () => {
    const id = await company({ currency: 'EUR', taxSystem: 'VAT', fiscalYearStartMonth: 1 });

    const settings = await runForOrganization(id, readPayrollSettings);

    expect(settings).toMatchObject({
      pfEnabled: false,
      esiEnabled: false,
      professionalTaxMonthly: 0,
      financialYearStartMonth: 1,
    });
  });
});

const regimes = (id: string) => runForOrganization(id, () => TaxRegimeModel.countDocuments());

describe('the Indian income-tax table', () => {
  it('is put in when a company under India rules is set up', async () => {
    const id = await company({ currency: 'INR', taxSystem: 'INDIA_GST' });

    await expect(regimes(id)).resolves.toBe(1);
    // Insert-only: a table HR has since corrected is never overwritten on restart.
    await expect(runForOrganization(id, ensureTaxSlabs)).resolves.toBe(0);
  });

  it('is not put in for anybody else — their income tax is not banded like this', async () => {
    const id = await company({ currency: 'EUR', taxSystem: 'VAT' });

    await expect(regimes(id)).resolves.toBe(0);
    await expect(runForOrganization(id, ensureTaxSlabs)).resolves.toBe(0);
    await expect(regimes(id)).resolves.toBe(0);
  });

  it('belongs to the one company it was seeded for', async () => {
    const indian = await company({ currency: 'INR', taxSystem: 'INDIA_GST' });
    const other = await company({ currency: 'EUR', taxSystem: 'VAT' });

    await expect(regimes(indian)).resolves.toBe(1);
    await expect(regimes(other)).resolves.toBe(0);
    await expect(OrganizationModel.countDocuments()).resolves.toBe(2);
  });
});
