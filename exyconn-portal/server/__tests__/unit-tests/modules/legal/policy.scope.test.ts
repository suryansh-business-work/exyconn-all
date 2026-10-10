import { Types } from 'mongoose';
import {
  assertPolicyCategory,
  assertPolicyInScope,
  policyScope,
  POLICY_ROLES,
} from '../../../../src/modules/legal/policy.scope';
import { PolicyModel } from '../../../../src/modules/legal/policy.model';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import type { GraphQLContext } from '../../../../src/middleware/auth';

const as = (roles: Role[]): GraphQLContext => ({
  user: { id: new Types.ObjectId().toHexString(), roles, email: 'someone@exyconn.com' },
});

const IT_ONLY = { category: { $in: ['IT', 'SECURITY'] } };

const policy = (slug: string, category: string) =>
  PolicyModel.create({
    title: slug,
    slug,
    body: '<p>Text</p>',
    category,
    effectiveDate: new Date('2026-01-01'),
  });

/** Runs a check that may throw synchronously and reports the code it settles with. */
const codeOfSync = (check: () => unknown) => codeOf((async () => check())());

useTestOrganization();

describe('policyScope', () => {
  it('is maintained by Legal and IT', () => {
    expect(POLICY_ROLES).toEqual([ROLES.LEGAL, ROLES.IT]);
  });

  it('gives Legal and an administrator the whole register', () => {
    expect(policyScope(as([ROLES.LEGAL]))).toEqual({});
    expect(policyScope(as([ROLES.ADMIN]))).toEqual({});
    expect(policyScope(as([ROLES.IT, ROLES.LEGAL]))).toEqual({});
  });

  it('narrows somebody who is only IT to the IT and security policies', () => {
    expect(policyScope(as([ROLES.IT]))).toEqual(IT_ONLY);
  });

  it('refuses anybody who maintains no policies', async () => {
    expect(await codeOfSync(() => policyScope({ user: null }))).toBe('UNAUTHENTICATED');
    expect(await codeOfSync(() => policyScope(as([ROLES.HR])))).toBe('FORBIDDEN');
  });
});

describe('assertPolicyCategory', () => {
  it('lets the whole-register scope write any category, or none', async () => {
    expect(await codeOfSync(() => assertPolicyCategory({}, 'HR'))).toBe('OK');
    expect(await codeOfSync(() => assertPolicyCategory({}, null))).toBe('OK');
  });

  it('lets IT write its own categories only', async () => {
    expect(await codeOfSync(() => assertPolicyCategory(IT_ONLY, 'IT'))).toBe('OK');
    expect(await codeOfSync(() => assertPolicyCategory(IT_ONLY, 'SECURITY'))).toBe('OK');
    expect(await codeOfSync(() => assertPolicyCategory(IT_ONLY, 'HR'))).toBe('FORBIDDEN');
  });

  it('refuses IT a policy with no category, which would read as GENERAL', async () => {
    expect(await codeOfSync(() => assertPolicyCategory(IT_ONLY, undefined))).toBe('FORBIDDEN');
  });
});

describe('assertPolicyInScope', () => {
  it('does not read anything for the whole-register scope', async () => {
    const read = jest.spyOn(PolicyModel, 'findById');

    expect(await codeOf(assertPolicyInScope({}, 'not-an-id'))).toBe('OK');
    expect(read).not.toHaveBeenCalled();
    read.mockRestore();
  });

  it('lets IT touch an existing IT policy', async () => {
    const row = await policy('vpn-policy', 'IT');

    expect(await codeOf(assertPolicyInScope(IT_ONLY, row._id.toHexString()))).toBe('OK');
  });

  it('refuses IT an existing policy from another team', async () => {
    const row = await policy('grievance', 'HR');

    expect(await codeOf(assertPolicyInScope(IT_ONLY, row._id.toHexString()))).toBe('FORBIDDEN');
  });

  it('refuses IT an id that is malformed or names no policy', async () => {
    expect(await codeOf(assertPolicyInScope(IT_ONLY, 'not-an-id'))).toBe('FORBIDDEN');
    expect(await codeOf(assertPolicyInScope(IT_ONLY, new Types.ObjectId().toHexString()))).toBe(
      'FORBIDDEN',
    );
  });
});
