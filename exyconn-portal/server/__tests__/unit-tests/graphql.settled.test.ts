import { mergeResolvers } from '../../src/graphql';
import { PositionModel } from '../../src/modules/hr/position.model';
import { useTestOrganization } from '../helpers';

useTestOrganization();

type Fn = (...args: unknown[]) => unknown;
type Merged = Record<string, Record<string, Fn>>;

describe('a resolver that returns a Mongoose query', () => {
  it('is settled, so the executor can read its result more than once', async () => {
    await PositionModel.create({ name: 'Engineer', department: 'Engineering' });
    const { Query, Department } = mergeResolvers([
      { Query: { positions: () => PositionModel.find().lean() } },
      { Department: { positions: () => PositionModel.find().lean() } },
    ]) as unknown as Merged;

    for (const resolve of [Query.positions, Department.positions]) {
      const result = resolve();
      // Reading a raw query twice is what the executor does, and what a query refuses.
      expect(await result).toHaveLength(1);
      expect(await result).toHaveLength(1);
    }
  });

  it('leaves a plain value and a settled promise alone', async () => {
    const { Query } = mergeResolvers([
      { Query: { n: () => 1, p: async () => 2 } },
    ]) as unknown as Merged;
    expect(Query.n()).toBe(1);
    expect(await Query.p()).toBe(2);
  });
});
