import { UserModel } from '../admin/user.model';
import { companyProfile } from '../../lib/company';
import { badRequest } from '../../utils/errors';
import { escapeRegex } from '../../utils/tableQuery';
import { LeavePolicyModel } from './leavePolicy.model';
import { LeaveBalanceModel } from './leaveBalance.model';

/**
 * Which leave rules and holidays reach an employee, decided by the country they work in.
 *
 * A leave type holds the company's global terms plus one optional override per country; a
 * holiday is either company-wide (and may be switched off for some countries) or belongs to
 * one country. Everything an employee is shown or charged goes through here, so the screen
 * they read and the balance an approval debits can never disagree.
 */

interface CountryOverride {
  country: string;
  annualQuota: number;
  carryForwardCap: number;
  active: boolean;
}

interface PolicyTerms {
  code: string;
  annualQuota: number;
  carryForwardCap: number;
  active: boolean;
  overrides?: CountryOverride[] | null;
}

/** The employee's own country, or the company's when HR has not set one. Empty if neither. */
export async function employeeCountry(employeeId: string): Promise<string> {
  return (await employeePlace(employeeId)).country;
}

/** Where an employee works, as far as holidays are concerned. '' is "not set". */
export interface EmployeePlace {
  country: string;
  region: string;
  city: string;
}

/** Where the employee works: their country (as employeeCountry), region and city. */
export async function employeePlace(employeeId: string): Promise<EmployeePlace> {
  const user = await UserModel.findById(employeeId).select('country region city').lean();
  return {
    country: user?.country ?? (await companyProfile()).country,
    region: user?.region ?? '',
    city: user?.city ?? '',
  };
}

/** A leave type as it applies in `country`: the override's terms where one exists. */
export function effectivePolicy<T extends PolicyTerms>(policy: T, country: string): T {
  const override = policy.overrides?.find((row) => row.country === country);
  if (!override) {
    return policy;
  }
  return {
    ...policy,
    annualQuota: override.annualQuota,
    carryForwardCap: override.carryForwardCap,
    active: override.active,
  };
}

/** Leave types an employee in `country` may apply for, alphabetically, terms resolved. */
export async function offeredPolicies(country: string) {
  const policies = await LeavePolicyModel.find().sort({ name: 1 }).lean();
  return policies.map((policy) => effectivePolicy(policy, country)).filter((p) => p.active);
}

/** Refuses a leave type the employee's country does not offer — or that does not exist. */
export async function assertLeaveTypeOffered(employeeId: string, code: string): Promise<void> {
  const offered = await offeredPolicies(await employeeCountry(employeeId));
  if (!offered.some((policy) => policy.code === code)) {
    badRequest(`${code} is not a leave type you can apply for`);
  }
}

/** A literal, case-blind match of one name in an array field. */
const namedIn = (name: string) => new RegExp(`^${escapeRegex(name)}$`, 'i');

/**
 * The holidays observed at `place`: company-wide ones its country has not opted out of, plus
 * the country's own — those for the whole country (no regions and no cities), and those naming
 * its region or its city (case aside). Holidays written before countries, regions or cities
 * existed lack the field: global, and whole-country, respectively.
 */
export function holidaysObservedIn({
  country,
  region = '',
  city = '',
}: Partial<EmployeePlace> & { country: string }) {
  const local = [
    ...(region === '' ? [] : [{ country, regions: namedIn(region) }]),
    ...(city === '' ? [] : [{ country, cities: namedIn(city) }]),
  ];
  return {
    $or: [
      { country: { $in: ['', null] }, excludedCountries: { $ne: country } },
      { country, regions: { $in: [[], null] }, cities: { $in: [[], null] } },
      ...local,
    ],
  };
}

/**
 * Gives the employee a balance for every metered leave type their country offers in `year`,
 * allocated at that country's quota. Existing balances are never touched — HR may have
 * adjusted them — so this only fills gaps, e.g. a leave type HR added after the year began.
 * A quota of zero is unmetered and gets no balance.
 */
export async function ensureLeaveBalances(employeeId: string, year: number): Promise<void> {
  const [offered, existing] = await Promise.all([
    offeredPolicies(await employeeCountry(employeeId)),
    LeaveBalanceModel.find({ employeeId, year }).select('leaveTypeCode').lean(),
  ]);
  const held = new Set(existing.map((balance) => balance.leaveTypeCode));
  const missing = offered.filter((policy) => policy.annualQuota > 0 && !held.has(policy.code));
  await Promise.all(
    missing.map((policy) =>
      LeaveBalanceModel.updateOne(
        { employeeId, leaveTypeCode: policy.code, year },
        { $setOnInsert: { allocated: policy.annualQuota } },
        { upsert: true },
      ),
    ),
  );
}
