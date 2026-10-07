import { Types } from 'mongoose';
import { hrMasterResolvers } from '../../../../src/modules/hrmaster';
import {
  effectivePolicy,
  employeeCountry,
  employeePlace,
  holidaysObservedIn,
} from '../../../../src/modules/hrmaster/leave-country';
import { useTestOrganization } from '../../../helpers';

useTestOrganization({ country: 'DE' });

describe('Holiday fields', () => {
  it('hands back what a holiday stored', () => {
    const holiday = {
      country: 'IN',
      excludedCountries: ['US'],
      regions: ['Karnataka'],
      cities: ['Bengaluru'],
    };
    const resolve = hrMasterResolvers.Holiday;

    expect(resolve.country(holiday)).toBe('IN');
    expect(resolve.excludedCountries(holiday)).toEqual(['US']);
    expect(resolve.regions(holiday)).toEqual(['Karnataka']);
    expect(resolve.cities(holiday)).toEqual(['Bengaluru']);
  });
});

describe('LeavePolicy.overrides', () => {
  it('reads a policy stored before overrides existed as having none', () => {
    expect(hrMasterResolvers.LeavePolicy.overrides({ overrides: null })).toEqual([]);
    expect(hrMasterResolvers.LeavePolicy.overrides({})).toEqual([]);
  });

  it('hands back the overrides a policy has', () => {
    const overrides = [{ country: 'US', annualQuota: 5, carryForwardCap: 0, active: true }];

    expect(hrMasterResolvers.LeavePolicy.overrides({ overrides })).toBe(overrides);
  });
});

describe('effectivePolicy', () => {
  it('keeps the global terms of a policy with no overrides at all', () => {
    const policy = {
      code: 'CL',
      annualQuota: 12,
      carryForwardCap: 3,
      active: true,
      overrides: null,
    };

    expect(effectivePolicy(policy, 'IN')).toBe(policy);
  });
});

describe('where an unknown employee works', () => {
  it("falls back to the company's country with no region or city", async () => {
    const id = String(new Types.ObjectId());

    await expect(employeePlace(id)).resolves.toEqual({ country: 'DE', region: '', city: '' });
    await expect(employeeCountry(id)).resolves.toBe('DE');
  });
});

describe('holidaysObservedIn', () => {
  it('asks only for company-wide and whole-country holidays when no region or city is given', () => {
    expect(holidaysObservedIn({ country: 'DE' })).toEqual({
      $or: [
        { country: { $in: ['', null] }, excludedCountries: { $ne: 'DE' } },
        { country: 'DE', regions: { $in: [[], null] }, cities: { $in: [[], null] } },
      ],
    });
  });

  it('adds a case-blind literal match for the region and the city', () => {
    const { $or } = holidaysObservedIn({
      country: 'IN',
      region: 'Tamil Nadu',
      city: 'Chennai (N)',
    });
    const [region, city] = $or.slice(2) as Array<{ regions?: RegExp; cities?: RegExp }>;

    expect($or).toHaveLength(4);
    expect(region.regions?.test('tamil nadu')).toBe(true);
    expect(city.cities?.test('chennai (n)')).toBe(true);
    expect(city.cities?.test('Chennai N')).toBe(false);
  });
});
