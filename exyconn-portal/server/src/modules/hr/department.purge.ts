import { DepartmentModel } from './department.model';
import { PositionModel } from './position.model';
import { OrganizationModel } from '../organizations/organization.model';
import { runAsPlatform, runForOrganization } from '../../lib/tenant';

export interface DepartmentPurge {
  organization: string;
  departments: number;
  positions: number;
  deleted: boolean;
}

/**
 * Removes every department and position of ONE organization, found by its handle (slug).
 * Nothing else is touched: employees keep the department and designation written on their
 * record, and other organizations' data is out of scope by construction. Without `confirm`
 * it only counts — what a person should look at before running it for real.
 */
export async function purgeDepartments(slug: string, confirm: boolean): Promise<DepartmentPurge> {
  const organization = await runAsPlatform(() => OrganizationModel.findOne({ slug }).lean());
  if (!organization) {
    throw new Error(`No organization has the handle "${slug}"`);
  }
  return runForOrganization(String(organization._id), async () => {
    const [departments, positions] = await Promise.all([
      DepartmentModel.countDocuments(),
      PositionModel.countDocuments(),
    ]);
    if (confirm) {
      await Promise.all([DepartmentModel.deleteMany({}), PositionModel.deleteMany({})]);
    }
    return { organization: organization.name, departments, positions, deleted: confirm };
  });
}
