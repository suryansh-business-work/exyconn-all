import { randomUUID } from 'node:crypto';
import { hrResolvers } from '../../src/modules/hr';
import { PositionModel } from '../../src/modules/hr/position.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import { seedUser, useTestOrganization } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

useTestOrganization();

type Resolver = (p: unknown, a: never, c: GraphQLContext) => Promise<{ id: string }>;
const mutation = (name: string) =>
  (hrResolvers.Mutation as Record<string, unknown>)[name] as Resolver;
const call = (name: string, args: object) => mutation(name)(null, args as never, hr);

const hr = { user: { id: 'hr', email: 'hr@exyconn.com', roles: [ROLES.HR] } } as GraphQLContext;

const position = (overrides: object = {}) => ({
  name: 'Engineer',
  department: 'Engineering',
  minSalary: 1000,
  maxSalary: 2000,
  headcount: 2,
  active: true,
  ...overrides,
});

const createDepartment = (name: string) => call('createDepartment', { input: { name } });

describe('departments and their positions', () => {
  it('refuses a position whose minimum salary is above its maximum', async () => {
    await expect(
      call('createPosition', { input: position({ minSalary: 3000, maxSalary: 2000 }) }),
    ).rejects.toThrow('minimum salary cannot be more than the maximum');
  });

  it('nests positions under their department and counts who holds them', async () => {
    await createDepartment('Engineering');
    await call('createPosition', { input: position() });
    const user = await seedUser('dev@exyconn.com', randomUUID(), [ROLES.EMPLOYEE]);
    await UserModel.updateOne(
      { _id: user._id },
      { department: 'Engineering', designation: 'Engineer' },
    );

    const [row] = await hrResolvers.Department.positions({ name: 'Engineering' });
    expect(row.name).toBe('Engineer');
    expect(await hrResolvers.Position.filled(row)).toBe(1);
  });

  it('moves positions and employees along when a department is renamed', async () => {
    const dept = await createDepartment('Engineering');
    await call('createPosition', { input: position() });
    const user = await seedUser('dev@exyconn.com', randomUUID(), [ROLES.EMPLOYEE]);
    await UserModel.updateOne({ _id: user._id }, { department: 'Engineering' });

    await call('updateDepartment', { id: dept.id, input: { name: 'Product Engineering' } });

    expect((await PositionModel.findOne({ name: 'Engineer' }).lean())?.department).toBe(
      'Product Engineering',
    );
    expect((await UserModel.findById(user._id).lean())?.department).toBe('Product Engineering');
  });

  it('refuses to delete a department that still has positions', async () => {
    const dept = await createDepartment('Engineering');
    await call('createPosition', { input: position() });

    await expect(call('deleteDepartment', { id: dept.id })).rejects.toThrow(
      'Move or delete the positions',
    );
  });
});
