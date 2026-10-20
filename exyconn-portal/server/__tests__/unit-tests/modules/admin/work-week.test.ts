import { Types } from 'mongoose';
import {
  normalizeWorkDays,
  orgDefaultWorkDays,
  saveDefaultWorkDays,
  workDaysOf,
} from '../../../../src/modules/admin/work-week';
import { workWeekResolvers } from '../../../../src/modules/admin/work-week.resolvers';
import { AppSettingsModel } from '../../../../src/modules/admin/settings.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

const ctxAs = (roles: Role[]): GraphQLContext =>
  ({
    user: { id: new Types.ObjectId().toHexString(), email: 'hr@exyconn.com', roles },
  }) as unknown as GraphQLContext;

describe('normalizeWorkDays', () => {
  it('sorts a valid week for storage', () => {
    expect(normalizeWorkDays([5, 1, 3])).toEqual([1, 3, 5]);
    expect(normalizeWorkDays([0, 6])).toEqual([0, 6]);
  });

  it.each([
    [[7], 'whole numbers from 0'],
    [[-1], 'whole numbers from 0'],
    [[1.5], 'whole numbers from 0'],
    [[1, 1], 'only once'],
    [[], 'at least one'],
  ])('refuses %j', (days, message) => {
    expect(() => normalizeWorkDays(days)).toThrow(message);
  });
});

describe('the workspace default week', () => {
  it('is Monday–Friday when no settings exist', async () => {
    await expect(orgDefaultWorkDays()).resolves.toEqual([1, 2, 3, 4, 5]);
  });

  it('falls back to Monday–Friday when the stored week is empty', async () => {
    await AppSettingsModel.collection.insertOne({ key: 'global', defaultWorkDays: [] });
    await expect(orgDefaultWorkDays()).resolves.toEqual([1, 2, 3, 4, 5]);
  });

  it('saves a normalised week and reads it back', async () => {
    await expect(saveDefaultWorkDays([6, 0, 1, 2, 3])).resolves.toEqual([0, 1, 2, 3, 6]);
    await expect(orgDefaultWorkDays()).resolves.toEqual([0, 1, 2, 3, 6]);
  });

  it('writes nothing when the week is invalid', async () => {
    await expect(saveDefaultWorkDays([8])).rejects.toThrow('whole numbers');
    expect(await AppSettingsModel.countDocuments()).toBe(0);
  });
});

describe('workDaysOf', () => {
  it('uses the person’s own week without reading the default', async () => {
    const orgDefault = jest.fn();
    await expect(workDaysOf({ workDays: [2, 4] }, orgDefault)).resolves.toEqual([2, 4]);
    expect(orgDefault).not.toHaveBeenCalled();
  });

  it.each([[null], [undefined], [{}], [{ workDays: [] }], [{ workDays: null }]])(
    'follows the workspace when the person has no week (%j)',
    async (user) => {
      const orgDefault = jest.fn().mockResolvedValue([0, 1]);
      await expect(workDaysOf(user, orgDefault)).resolves.toEqual([0, 1]);
      expect(orgDefault).toHaveBeenCalledTimes(1);
    },
  );

  it('reads the stored workspace week by default', async () => {
    await saveDefaultWorkDays([1, 2, 3]);
    await expect(workDaysOf({ workDays: null })).resolves.toEqual([1, 2, 3]);
  });
});

describe('workWeekResolvers', () => {
  const { User, Query, Mutation } = workWeekResolvers;

  it('shows a person’s own week, or null when they follow the workspace', () => {
    expect(User.workDays({ workDays: [1, 2] })).toEqual([1, 2]);
    expect(User.workDays({ workDays: [] })).toBeNull();
    expect(User.workDays({})).toBeNull();
  });

  it('reads the workspace default once per request for every row', async () => {
    await saveDefaultWorkDays([1, 2, 3, 4]);
    const ctx = ctxAs([ROLES.HR]);
    const findOne = jest.spyOn(AppSettingsModel, 'findOne');

    const weeks = await Promise.all([
      User.effectiveWorkDays({ workDays: null }, null, ctx),
      User.effectiveWorkDays({}, null, ctx),
      User.effectiveWorkDays({ workDays: [6] }, null, ctx),
    ]);

    expect(weeks).toEqual([[1, 2, 3, 4], [1, 2, 3, 4], [6]]);
    expect(findOne).toHaveBeenCalledTimes(1);
    findOne.mockRestore();
  });

  it('lets any signed-in person read the house week, and nobody signed out', async () => {
    await expect(Query.workWeek(null, null, ctxAs([ROLES.EMPLOYEE]))).resolves.toEqual({
      defaultWorkDays: [1, 2, 3, 4, 5],
    });
    await expect(
      codeOf(Query.workWeek(null, null, { user: null } as unknown as GraphQLContext)),
    ).resolves.toBe('UNAUTHENTICATED');
  });

  it('lets HR set the default week and records the change', async () => {
    const result = await Mutation.setDefaultWorkDays(null, { days: [6, 1, 2] }, ctxAs([ROLES.HR]));

    expect(result).toEqual({ defaultWorkDays: [1, 2, 6] });
    await expect(orgDefaultWorkDays()).resolves.toEqual([1, 2, 6]);
    const audit = await AuditLogModel.findOne().lean();
    expect(audit).toMatchObject({
      action: 'SETTINGS',
      module: 'AppSettings',
      summary: 'Set the default work week to days 1, 2, 6',
    });
    expect(JSON.parse(String(audit?.changes))).toEqual({
      defaultWorkDays: { from: [1, 2, 3, 4, 5], to: [1, 2, 6] },
    });
  });

  it('refuses an employee and an invalid week, changing nothing', async () => {
    await expect(
      codeOf(Mutation.setDefaultWorkDays(null, { days: [1] }, ctxAs([ROLES.EMPLOYEE]))),
    ).resolves.toBe('FORBIDDEN');
    await expect(
      codeOf(Mutation.setDefaultWorkDays(null, { days: [] }, ctxAs([ROLES.HR]))),
    ).resolves.toBe('BAD_USER_INPUT');
    await expect(orgDefaultWorkDays()).resolves.toEqual([1, 2, 3, 4, 5]);
    expect(await AuditLogModel.countDocuments()).toBe(0);
  });
});
