import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { ROLES } from '../../src/constants/roles';
import { PayrollSettingsModel } from '../../src/modules/payroll';
import { seedUser } from '../helpers';

let app: Express;

const gql = (query: string, variables?: Record<string, unknown>, token?: string) => {
  const req = request(app).post('/graphql').send({ query, variables });
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req;
};

/** Exactly what HR › Payroll Settings asks for. */
const FIELDS = `pfEnabled pfEmployeePercent pfWageCeiling esiEnabled esiEmployeePercent esiWageLimit
  professionalTaxMonthly tdsMode tdsFlatPercent tdsSlabs { upTo percent } tdsAnnualExemption
  tdsCessPercent tdsRegimeKey financialYearStartMonth runFromDay`;

beforeAll(async () => {
  app = await createApp();
});

/** The settings document as the first payroll release wrote it, before the TDS table. */
const firstRelease = (organizationId: unknown) => ({
  organizationId,
  key: 'global',
  pfEnabled: true,
  pfEmployeePercent: 12,
  pfWageCeiling: 15000,
  esiEnabled: true,
  esiEmployeePercent: 0.75,
  esiWageLimit: 21000,
  professionalTaxMonthly: 200,
  tdsMode: 'NONE',
  tdsFlatPercent: 0,
});

async function signInAsHr(): Promise<{ token: string; organizationId: unknown }> {
  const user = await seedUser('hr@exyconn.com', 'Hr@123456', [ROLES.HR]);
  const res = await gql(`mutation($e:String!,$p:String!){ login(email:$e,password:$p){ token } }`, {
    e: 'hr@exyconn.com',
    p: 'Hr@123456',
  });
  return {
    token: res.body.data.login.token,
    organizationId: user.get('organizationId') as unknown,
  };
}

describe('HR › Payroll Settings over GraphQL', () => {
  it('reads settings saved before the newer fields existed', async () => {
    const { token, organizationId } = await signInAsHr();
    await PayrollSettingsModel.collection.insertOne(firstRelease(organizationId));

    const res = await gql(`{ payrollSettings { ${FIELDS} } }`, undefined, token);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.payrollSettings).toMatchObject({
      tdsSlabs: [],
      tdsAnnualExemption: 0,
      tdsCessPercent: 0,
      runFromDay: 25,
    });
  });

  it('saves over those settings with only the fields the form always sends', async () => {
    const { token, organizationId } = await signInAsHr();
    await PayrollSettingsModel.collection.insertOne(firstRelease(organizationId));
    const input = {
      pfEnabled: true,
      pfEmployeePercent: 12,
      pfWageCeiling: 15000,
      esiEnabled: false,
      esiEmployeePercent: 0.75,
      esiWageLimit: 21000,
      professionalTaxMonthly: 200,
      tdsMode: 'NONE',
      tdsFlatPercent: 0,
      runFromDay: 26,
    };

    const res = await gql(
      `mutation($i:PayrollSettingsInput!){ updatePayrollSettings(input:$i){ ${FIELDS} } }`,
      { i: input },
      token,
    );

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.updatePayrollSettings).toMatchObject({
      esiEnabled: false,
      tdsSlabs: [],
      tdsCessPercent: 0,
      runFromDay: 26,
    });
  });
});
