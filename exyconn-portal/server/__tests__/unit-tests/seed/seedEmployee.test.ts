import { randomUUID } from 'node:crypto';
import { seedEmployeeData } from '../../../src/seed/seedEmployee';
import { DepartmentModel } from '../../../src/modules/hr/department.model';
import { PositionModel } from '../../../src/modules/hr/position.model';
import { PolicyModel } from '../../../src/modules/legal/policy.model';
import { HolidayModel } from '../../../src/modules/employee/holiday.model';
import { SalaryStructureModel } from '../../../src/modules/employee/salary.model';
import { SalarySlipModel } from '../../../src/modules/employee/salarySlip.model';
import { SupportTicketModel } from '../../../src/modules/employee/support.model';
import { ROLES } from '../../../src/constants/roles';
import { logger } from '../../../src/utils/logger';
import { seedUser, useTestOrganization } from '../../helpers';

useTestOrganization({ currency: 'INR' });

const byText = (a: string, b: string) => a.localeCompare(b);

let info: jest.SpyInstance;

beforeEach(() => {
  info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

const seedPeople = async () => [
  await seedUser('asha@test.co', randomUUID(), [ROLES.EMPLOYEE]),
  await seedUser('ravi@test.co', randomUUID(), [ROLES.HR]),
];

describe('seedEmployeeData: company-wide data', () => {
  it('seeds the departments, positions, policies and holidays a fresh workspace needs', async () => {
    await seedEmployeeData();

    const departments = await DepartmentModel.find().lean();
    expect(departments.map((d) => d.name).sort(byText)).toEqual([
      'Engineering',
      'Operations',
      'People',
    ]);
    const positions = await PositionModel.find().lean();
    expect(positions).toHaveLength(4);
    expect(positions.find((p) => p.name === 'HR Manager')?.department).toBe('People');

    const policies = await PolicyModel.find().lean();
    expect(policies).toHaveLength(5);
    expect(
      policies
        .filter((p) => p.requiresAcknowledgement)
        .map((p) => p.slug)
        .sort(byText),
    ).toEqual(['acceptable-use-of-it', 'code-of-conduct']);
    expect(info).toHaveBeenCalledWith('Seeded 5 policies');

    const holidays = await HolidayModel.find().lean();
    expect(holidays).toHaveLength(8);
    const christmas = holidays.find((h) => h.name === 'Christmas');
    expect(christmas?.date).toEqual(new Date(new Date().getFullYear(), 11, 25));
    expect(christmas?.type).toBe('PUBLIC');
  });

  it('adds nothing twice when run again', async () => {
    await seedEmployeeData();
    info.mockClear();

    await seedEmployeeData();

    expect(await DepartmentModel.countDocuments()).toBe(3);
    expect(await PositionModel.countDocuments()).toBe(4);
    expect(await PolicyModel.countDocuments()).toBe(5);
    expect(await HolidayModel.countDocuments()).toBe(8);
    expect(info).not.toHaveBeenCalledWith('Seeded 5 policies');
  });

  it('leaves policies alone once any exist', async () => {
    await PolicyModel.create({
      title: 'Our own policy',
      slug: 'our-own',
      body: '<p>Ours</p>',
      effectiveDate: new Date(),
    });

    await seedEmployeeData();

    expect(await PolicyModel.countDocuments()).toBe(1);
  });
});

describe('seedEmployeeData: each person', () => {
  it('gives every person a salary structure, three paid payslips and sample tickets', async () => {
    const people = await seedPeople();

    await seedEmployeeData();

    for (const person of people) {
      const employeeId = person._id.toHexString();
      const structure = await SalaryStructureModel.findOne({ employeeId }).lean();
      expect(structure).toEqual(
        expect.objectContaining({ currency: 'INR', basic: 60000, hra: 24000, deductions: 8000 }),
      );
      const slips = await SalarySlipModel.find({ employeeId }).lean();
      expect(slips).toHaveLength(3);
      expect(slips.every((s) => s.status === 'PAID' && s.gross === 100000 && s.net === 92000)).toBe(
        true,
      );
      expect(new Set(slips.map((s) => `${s.year}-${s.month}`)).size).toBe(3);
      expect(await SupportTicketModel.countDocuments({ employeeId })).toBe(2);
    }
    expect(info).toHaveBeenCalledWith('Seeded workspace data for 2 user(s)');
  });

  it('pays the three months before this one', async () => {
    const [person] = await seedPeople();
    const now = new Date();
    const expected = [1, 2, 3].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 28);
      return `${d.getFullYear()}-${d.getMonth() + 1}`;
    });

    await seedEmployeeData();

    const slips = await SalarySlipModel.find({ employeeId: person._id.toHexString() }).lean();
    expected.sort(byText);
    expect(slips.map((s) => `${s.year}-${s.month}`).sort(byText)).toEqual(expected);
  });

  it('keeps what a person already has on a second run', async () => {
    const [person] = await seedPeople();
    const employeeId = person._id.toHexString();
    await seedEmployeeData();
    await SalaryStructureModel.updateOne({ employeeId }, { basic: 70000 });

    await seedEmployeeData();

    expect((await SalaryStructureModel.findOne({ employeeId }).lean())?.basic).toBe(70000);
    expect(await SalarySlipModel.countDocuments({ employeeId })).toBe(3);
    expect(await SupportTicketModel.countDocuments({ employeeId })).toBe(2);
  });
});
