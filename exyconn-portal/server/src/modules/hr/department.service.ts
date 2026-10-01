import { isValidObjectId } from 'mongoose';
import { DepartmentModel } from './department.model';
import { PositionModel } from './position.model';
import { UserModel } from '../admin/user.model';
import { badRequest } from '../../utils/errors';
import { withIds } from '../../utils/serialize';

export interface SalaryBand {
  minSalary?: number | null;
  maxSalary?: number | null;
}

/** A band whose floor sits above its ceiling cannot be paid inside. */
export function assertSalaryBand({ minSalary, maxSalary }: SalaryBand): void {
  if ((minSalary ?? 0) > (maxSalary ?? 0)) {
    badRequest('The minimum salary cannot be more than the maximum salary');
  }
}

/**
 * A department's positions, by name, ready for GraphQL.
 *
 * Awaited here rather than returned as a query: a Mongoose query is a thenable that runs on
 * the first `.then()`, and the executor subscribes to a field's result twice, which the query
 * refuses with "Query was already executed".
 */
export async function positionsOf(department: string) {
  return withIds(await PositionModel.find({ department }).sort({ name: 1 }).lean());
}

/** What a position stored before its salary band and headcount existed is given on boot. */
const POSITION_DEFAULTS = { minSalary: 0, maxSalary: 0, headcount: 1, active: true };

/**
 * Gives every position written under the original name/department/description schema the
 * fields GraphQL declares non-null. `.lean()` skips schema defaults, so one such row nulled
 * `minSalary` and failed the whole ListDepartments response. A no-op once none is left.
 */
export async function backfillPositionDefaults(): Promise<void> {
  for (const [field, value] of Object.entries(POSITION_DEFAULTS)) {
    await PositionModel.updateMany({ [field]: null }, { $set: { [field]: value } });
  }
}

/** The department head's name for display; null when nobody is set. */
export async function headNameOf(headId?: string | null): Promise<string | null> {
  if (!headId || !isValidObjectId(headId)) return null;
  const head = await UserModel.findById(headId).select('name').lean();
  return head?.name ?? null;
}

/** Active people holding a position, which is what its headcount is measured against. */
export async function filledCount(position: { name: string; department: string }): Promise<number> {
  return UserModel.countDocuments({
    isActive: true,
    department: position.department,
    designation: position.name,
  });
}

/** The department's current name, read before an update so a rename can be followed. */
export async function departmentNameOf(id: string): Promise<string | null> {
  const row = await DepartmentModel.findById(id).select('name').lean();
  return row?.name ?? null;
}

/**
 * Positions and employee records carry the department by name, so a rename moves them along
 * with it — otherwise every position would drop out of the department it was created in.
 */
export async function followDepartmentRename(from: string | null, to: string): Promise<void> {
  if (!from || from === to) return;
  await PositionModel.updateMany({ department: from }, { department: to });
  await UserModel.updateMany({ department: from }, { department: to });
}

/** A department is removed only once it is empty of positions, so none are orphaned. */
export async function assertDepartmentEmpty(id: string): Promise<void> {
  const name = await departmentNameOf(id);
  if (name && (await PositionModel.exists({ department: name }))) {
    badRequest(`Move or delete the positions in "${name}" before deleting it`);
  }
}
