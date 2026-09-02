import type { SortOrder } from 'mongoose';
import { assertAuthenticated } from '../middleware/roleGuard';
import { withIds } from '../utils/serialize';
import type { GraphQLContext } from '../middleware/auth';

type Sort = Record<string, SortOrder>;
type LeanDoc = { _id: unknown };

/**
 * The slice of a Mongoose model these helpers use. Structural rather than
 * `Model<T>` so every module can pass its own document type without a cast.
 */
export interface EmployeeScopedModel {
  find(filter: Record<string, unknown>): {
    sort(sort: Sort): { lean(): Promise<unknown[]> };
  };
  findOne(filter: Record<string, unknown>): Promise<unknown>;
}

/**
 * Builds the `my<Thing>` resolver every employee self-service module needs: the
 * signed-in user's own rows and nobody else's. The employee id comes from the
 * verified token, never from arguments, so one employee cannot read another's.
 */
export function createMyRecordsResolver(model: EmployeeScopedModel, sort: Sort) {
  return async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
    const user = assertAuthenticated(ctx);
    const rows = await model.find({ employeeId: user.id }).sort(sort).lean();
    return withIds(rows as LeanDoc[]);
  };
}

/**
 * Loads one of the signed-in employee's own rows for a mutation, refusing a row
 * that belongs to somebody else.
 */
export async function findOwnRecord<T>(
  model: EmployeeScopedModel,
  id: string,
  ctx: GraphQLContext,
): Promise<T> {
  const user = assertAuthenticated(ctx);
  const row = await model.findOne({ _id: id, employeeId: user.id });
  if (!row) throw new Error('Not found');
  return row as T;
}
