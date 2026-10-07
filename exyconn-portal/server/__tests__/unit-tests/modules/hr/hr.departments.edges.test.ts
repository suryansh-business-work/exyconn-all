import { Types } from 'mongoose';
import { hrResolvers } from '../../../../src/modules/hr';
import { DepartmentModel } from '../../../../src/modules/hr/department.model';
import { PositionModel } from '../../../../src/modules/hr/position.model';
import { UserModel } from '../../../../src/modules/admin/user.model';
import {
  assertSalaryBand,
  followDepartmentRename,
} from '../../../../src/modules/hr/department.service';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';

useTestOrganization();

type Resolver = (p: unknown, a: never, c: GraphQLContext) => Promise<{ id: string } | boolean>;
const mutation = (name: string) =>
  (hrResolvers.Mutation as Record<string, unknown>)[name] as Resolver;
const hr = { user: { id: 'hr', email: 'hr@exyconn.com', roles: [ROLES.HR] } } as GraphQLContext;
const emp = {
  user: { id: 'e', email: 'e@exyconn.com', roles: [ROLES.EMPLOYEE] },
} as GraphQLContext;
const call = (name: string, args: object, ctx: GraphQLContext = hr) =>
  mutation(name)(null, args as never, ctx);

const position = (overrides: object = {}) => ({
  name: 'Engineer',
  department: 'Engineering',
  minSalary: 1000,
  maxSalary: 2000,
  ...overrides,
});

const person = (name: string) =>
  UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.com`,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
  });

describe('assertSalaryBand', () => {
  it('accepts an unset band and a floor equal to the ceiling', () => {
    expect(() => assertSalaryBand({})).not.toThrow();
    expect(() => assertSalaryBand({ minSalary: null, maxSalary: null })).not.toThrow();
    expect(() => assertSalaryBand({ minSalary: 1500, maxSalary: 1500 })).not.toThrow();
  });

  it('refuses a floor with no ceiling', () => {
    expect(() => assertSalaryBand({ minSalary: 100 })).toThrow('minimum salary');
  });
});

describe('Department.headName', () => {
  it('names the head when one is set', async () => {
    const head = await person('Meera');

    await expect(hrResolvers.Department.headName({ headId: String(head._id) })).resolves.toBe(
      'Meera',
    );
  });

  it.each([
    ['no head', null],
    ['an id that is not an object id', 'not-an-id'],
    ['a head who no longer exists', String(new Types.ObjectId())],
  ])('is null for %s', async (_label, headId) => {
    await expect(hrResolvers.Department.headName({ headId })).resolves.toBeNull();
  });
});

describe('department writes', () => {
  it('keeps positions where they are when a department is saved under the same name', async () => {
    const dept = (await call('createDepartment', { input: { name: 'Engineering' } })) as {
      id: string;
    };
    await PositionModel.create(position());

    await call('updateDepartment', {
      id: dept.id,
      input: { name: '  Engineering  ', code: 'eng' },
    });

    expect((await DepartmentModel.findById(dept.id).lean())?.code).toBe('ENG');
    expect(await PositionModel.countDocuments({ department: 'Engineering' })).toBe(1);
  });

  it('deletes a department that has no positions left', async () => {
    const dept = (await call('createDepartment', { input: { name: 'Legal' } })) as { id: string };

    await expect(call('deleteDepartment', { id: dept.id })).resolves.toBe(true);
    expect(await DepartmentModel.countDocuments()).toBe(0);
  });

  it('reports a department that does not exist rather than checking its positions', async () => {
    await expect(call('deleteDepartment', { id: String(new Types.ObjectId()) })).rejects.toThrow(
      'Department not found',
    );
  });

  it.each([
    ['updateDepartment', { id: String(new Types.ObjectId()), input: { name: 'X' } }],
    ['deleteDepartment', { id: String(new Types.ObjectId()) }],
  ])('%s is HR only', async (name, args) => {
    await expect(call(name, args, emp)).rejects.toThrow();
  });

  it('does nothing when there is no previous name to follow', async () => {
    await PositionModel.create(position());

    await followDepartmentRename(null, 'Product');

    expect(await PositionModel.countDocuments({ department: 'Engineering' })).toBe(1);
  });
});

describe('position writes', () => {
  it('refuses an upside-down band on update and leaves the position alone', async () => {
    const created = (await call('createPosition', { input: position() })) as { id: string };

    await expect(
      call('updatePosition', {
        id: created.id,
        input: position({ minSalary: 5000, maxSalary: 4000 }),
      }),
    ).rejects.toThrow('minimum salary cannot be more than the maximum');
    expect((await PositionModel.findById(created.id).lean())?.minSalary).toBe(1000);
  });

  it('updates a position whose band is sound', async () => {
    const created = (await call('createPosition', { input: position() })) as { id: string };

    await call('updatePosition', {
      id: created.id,
      input: position({ minSalary: 1200, maxSalary: 2400 }),
    });

    expect((await PositionModel.findById(created.id).lean())?.maxSalary).toBe(2400);
  });
});
