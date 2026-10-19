import { describe, expect, it } from 'vitest';
import { CompanyStatus } from '@exyconn/shell/graphql/generated';
import {
  buildCompanySchema,
  toCompanyInput,
  toCompanyValues,
} from '../../../../../../src/pages/companies/forms/company/company.schema';
import { companyRow } from '../../../../fixtures';

const schema = buildCompanySchema([]);
const valid = toCompanyValues(companyRow(), []);

/** The messages the schema reports for `field` once `value` is typed into it. */
function errorsFor(field: 'annualRevenue' | 'employeeCount' | 'foundedYear', value: string) {
  const result = schema.safeParse({ ...valid, [field]: value });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('company schema', () => {
  it('starts a new company as a blank prospect', () => {
    const values = toCompanyValues(null, []);

    expect(values).toMatchObject({
      name: '',
      domain: '',
      size: '',
      status: CompanyStatus.Prospect,
      annualRevenue: '',
      employeeCount: '',
      foundedYear: '',
      emails: [],
      custom: {},
    });
  });

  it('shows stored numbers as text, keeping zero', () => {
    const values = toCompanyValues(
      companyRow({ annualRevenue: 0, employeeCount: 250, foundedYear: 2015 }),
      [],
    );

    expect(values).toMatchObject({ annualRevenue: '0', employeeCount: '250', foundedYear: '2015' });
  });

  it('accepts the numbers left blank or as whole numbers up to their limits', () => {
    expect(errorsFor('annualRevenue', '')).toEqual([]);
    expect(errorsFor('annualRevenue', '1000000000000000')).toEqual([]);
    expect(errorsFor('employeeCount', ' 10000000 ')).toEqual([]);
    expect(errorsFor('foundedYear', String(new Date().getFullYear()))).toEqual([]);
  });

  it('rejects numbers that are not whole or exceed the limit', () => {
    expect(errorsFor('annualRevenue', '12.5')).toEqual(['Enter the revenue as a whole number']);
    expect(errorsFor('annualRevenue', '1000000000000001')).toEqual([
      'Enter the revenue as a whole number',
    ]);
    expect(errorsFor('employeeCount', '-3')).toEqual(['Enter the number of employees']);
    expect(errorsFor('employeeCount', '10000001')).toEqual(['Enter the number of employees']);
    expect(errorsFor('foundedYear', String(new Date().getFullYear() + 1))).toEqual([
      'Enter a year like 2015',
    ]);
  });

  it('sends blank numbers as null and typed ones as numbers', () => {
    const input = toCompanyInput(
      { ...valid, annualRevenue: '', employeeCount: '40', foundedYear: '0' },
      [],
    );

    expect(input).toMatchObject({ annualRevenue: null, employeeCount: 40, foundedYear: 0 });
  });
});
