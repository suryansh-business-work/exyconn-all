import type { GraphQLError } from 'graphql';
import {
  createMyRecordsResolver,
  findOwnRecord,
  type EmployeeScopedModel,
} from '../../../src/lib/employeeScope';
import { ROLES } from '../../../src/constants/roles';
import type { GraphQLContext } from '../../../src/middleware/auth';

const employee: GraphQLContext = {
  user: { id: 'emp-1', email: 'emp@example.com', roles: [ROLES.EMPLOYEE] },
};

/** A model double that records the filter and sort it was asked for. */
function fakeModel(rows: unknown[], one: unknown = null) {
  const lean = jest.fn().mockResolvedValue(rows);
  const sort = jest.fn(() => ({ lean }));
  const find = jest.fn(() => ({ sort }));
  const findOne = jest.fn().mockResolvedValue(one);
  const model: EmployeeScopedModel = { find, findOne };
  return { model, find, sort, findOne };
}

const codeOf = (error: unknown) => (error as GraphQLError).extensions?.code;

describe('createMyRecordsResolver', () => {
  it('returns only the signed-in employee’s rows, sorted, with ids', async () => {
    const { model, find, sort } = fakeModel([{ _id: 'a1', title: 'Goal' }]);
    const resolve = createMyRecordsResolver(model, { createdAt: -1 });
    await expect(resolve(null, { employeeId: 'emp-2' }, employee)).resolves.toEqual([
      { _id: 'a1', id: 'a1', title: 'Goal' },
    ]);
    expect(find).toHaveBeenCalledWith({ employeeId: 'emp-1' });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('returns an empty list when the employee has none', async () => {
    const { model } = fakeModel([]);
    await expect(createMyRecordsResolver(model, {})(null, {}, employee)).resolves.toEqual([]);
  });

  it('refuses an anonymous caller before touching the model', async () => {
    const { model, find } = fakeModel([]);
    const refusal = await createMyRecordsResolver(model, {})(null, {}, { user: null }).catch(
      (error: unknown) => error,
    );
    expect(codeOf(refusal)).toBe('UNAUTHENTICATED');
    expect(find).not.toHaveBeenCalled();
  });
});

describe('findOwnRecord', () => {
  it('loads a row that belongs to the caller', async () => {
    const row = { _id: 'r1', employeeId: 'emp-1' };
    const { model, findOne } = fakeModel([], row);
    await expect(findOwnRecord(model, 'r1', employee)).resolves.toBe(row);
    expect(findOne).toHaveBeenCalledWith({ _id: 'r1', employeeId: 'emp-1' });
  });

  it('reports somebody else’s row as not found', async () => {
    const { model } = fakeModel([], null);
    await expect(findOwnRecord(model, 'r2', employee)).rejects.toThrow('Record not found');
  });

  it('refuses an anonymous caller', async () => {
    const { model } = fakeModel([], {});
    const refusal = await findOwnRecord(model, 'r1', { user: null }).catch((e: unknown) => e);
    expect(codeOf(refusal)).toBe('UNAUTHENTICATED');
  });
});
