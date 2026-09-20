import { adminService } from '../../src/modules/admin/admin.service';
import { UserModel } from '../../src/modules/admin/user.model';
import {
  EmploymentTypeModel,
  GradeModel,
  LocationModel,
  ShiftModel,
  TeamModel,
} from '../../src/modules/orgmaster/orgmaster.models';
import { ROLES } from '../../src/constants/roles';
import { useTestOrganization } from '../helpers';

/**
 * The five org masters were CRUD screens with nothing on either side of them: an employee
 * could not be put at a location, in a team or on a shift. These tests are about the join
 * that was missing, and about refusing a code that does not exist — a typo would read as
 * "not placed" on every screen, which looks exactly like somebody nobody got round to.
 */

const joiner = {
  name: 'Nikhil Roy',
  email: 'nikhil@exyconn.com',
  roles: [ROLES.EMPLOYEE],
  department: 'Engineering',
  designation: 'Engineer',
  joinDate: new Date('2026-09-01'),
};

async function seedMasters() {
  await LocationModel.create({ name: 'Pune office', code: 'PNQ', timezone: 'Asia/Kolkata' });
  await TeamModel.create({ name: 'Platform', department: 'Engineering' });
  await GradeModel.create({ name: 'Senior', code: 'G4', level: 4 });
  await EmploymentTypeModel.create({ name: 'Permanent', code: 'PERM', payrollEligible: true });
  await ShiftModel.create({ name: 'General', code: 'GEN', startTime: '09:30', endTime: '18:30' });
}

const placement = {
  locationCode: 'PNQ',
  teamName: 'Platform',
  gradeCode: 'G4',
  employmentTypeCode: 'PERM',
  shiftCode: 'GEN',
};

describe('placing an employee in the org', () => {
  useTestOrganization();
  beforeEach(seedMasters);

  it('records every master on the account it creates', async () => {
    const { user } = await adminService.createUser({ ...joiner, ...placement });

    const stored = await UserModel.findById(user._id).lean();
    expect(stored).toMatchObject(placement);
  });

  it('places somebody who was created before the masters were set up', async () => {
    const { user } = await adminService.createUser(joiner);

    await adminService.updateUser(String(user._id), placement);

    expect(await UserModel.findById(user._id).lean()).toMatchObject(placement);
  });

  it('takes a lower-case code as the code it is', async () => {
    const { user } = await adminService.createUser({ ...joiner, locationCode: 'pnq' });

    expect(await UserModel.findById(user._id).lean()).toMatchObject({ locationCode: 'PNQ' });
  });

  it('refuses a code no master has, rather than storing it loose', async () => {
    await expect(adminService.createUser({ ...joiner, shiftCode: 'NIGHT' })).rejects.toThrow(
      'There is no shift "NIGHT"',
    );

    await expect(adminService.createUser({ ...joiner, teamName: 'Ghost team' })).rejects.toThrow(
      'There is no team "Ghost team"',
    );
  });

  it('leaves somebody unplaced when nothing is chosen', async () => {
    const { user } = await adminService.createUser(joiner);

    expect(await UserModel.findById(user._id).lean()).toMatchObject({
      locationCode: '',
      teamName: '',
      shiftCode: '',
    });
  });

  it('clears a placement when it is emptied', async () => {
    const { user } = await adminService.createUser({ ...joiner, ...placement });

    await adminService.updateUser(String(user._id), { shiftCode: '' });

    expect(await UserModel.findById(user._id).lean()).toMatchObject({
      shiftCode: '',
      locationCode: '',
    });
  });
});
