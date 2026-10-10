import { Types } from 'mongoose';
import { companyProfile, followsIndianTaxRules } from '../../../src/lib/company';
import { OrganizationModel } from '../../../src/modules/organizations/organization.model';
import { TenantScopeError, runForOrganization } from '../../../src/lib/tenant';

describe('companyProfile', () => {
  it('refuses to guess a company when none is in scope', async () => {
    await expect(companyProfile()).rejects.toBeInstanceOf(TenantScopeError);
  });

  it('refuses a scope pointing at a company that does not exist', async () => {
    const ghost = new Types.ObjectId().toHexString();
    await expect(runForOrganization(ghost, companyProfile)).rejects.toThrow(
      /Reading the company profile/,
    );
  });

  it('reads the company’s own currency, locale, clock and tax rules', async () => {
    const org = await OrganizationModel.create({
      name: 'Acme India',
      slug: 'acme-india',
      currency: 'INR',
      locale: 'en-IN',
      timezone: 'Asia/Kolkata',
      country: 'in',
      fiscalYearStartMonth: 4,
      taxSystem: 'INDIA_GST',
    });
    await expect(runForOrganization(org._id.toHexString(), companyProfile)).resolves.toEqual({
      currency: 'INR',
      locale: 'en-IN',
      timezone: 'Asia/Kolkata',
      country: 'IN',
      fiscalYearStartMonth: 4,
      taxSystem: 'INDIA_GST',
    });
  });

  it('fills in the international defaults', async () => {
    const org = await OrganizationModel.create({ name: 'Plain', slug: 'plain', currency: 'EUR' });
    await expect(runForOrganization(org._id.toHexString(), companyProfile)).resolves.toEqual({
      currency: 'EUR',
      locale: 'en',
      timezone: 'UTC',
      country: '',
      fiscalYearStartMonth: 1,
      taxSystem: 'NONE',
    });
  });

  it('reads a country stored as null as empty', async () => {
    const org = await OrganizationModel.create({ name: 'Nul', slug: 'nul', currency: 'USD' });
    await OrganizationModel.collection.updateOne({ _id: org._id }, { $set: { country: null } });
    const profile = await runForOrganization(org._id.toHexString(), companyProfile);
    expect(profile.country).toBe('');
  });
});

describe('followsIndianTaxRules', () => {
  const base = {
    currency: 'INR',
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    country: 'IN',
    fiscalYearStartMonth: 4,
  };

  it('is true only for the India GST pack', () => {
    expect(followsIndianTaxRules({ ...base, taxSystem: 'INDIA_GST' })).toBe(true);
    expect(followsIndianTaxRules({ ...base, taxSystem: 'NONE' })).toBe(false);
  });
});
