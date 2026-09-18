import { isValidObjectId } from 'mongoose';
import { DepartmentModel } from './department.model';
import { PositionModel } from './position.model';
import { UserModel } from '../admin/user.model';
import { badRequest } from '../../utils/errors';

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

/** A department's positions, by name. */
export function positionsOf(department: string) {
  return PositionModel.find({ department }).sort({ name: 1 }).lean();
}

/** The department head's name for display; null when nobody is set. */
export async function headNameOf(headId?: string | null): Promise<string | null> {
  if (!headId || !isValidObjectId(headId)) return null;
  const head = await UserModel.findById(headId).select('name').lean();
  return head?.name ?? null;
}

/** Active people holding a position, which is what its headcount is measured against. */
export function filledCount(position: { name: string; department: string }): Promise<number> {
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
