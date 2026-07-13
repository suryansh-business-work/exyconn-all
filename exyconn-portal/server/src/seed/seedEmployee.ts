import { UserModel } from '../modules/admin/user.model';
import { SalaryStructureModel } from '../modules/employee/salary.model';
import { SalarySlipModel } from '../modules/employee/salarySlip.model';
import { PolicyModel } from '../modules/employee/policy.model';
import { HolidayModel } from '../modules/employee/holiday.model';
import { SupportTicketModel } from '../modules/employee/support.model';
import { DepartmentModel } from '../modules/hr/department.model';
import { PositionModel } from '../modules/hr/position.model';
import { logger } from '../utils/logger';

const YEAR = new Date().getFullYear();

// A few departments/positions so the admin "create user" form is usable on a
// fresh database (both fields are required and populated from HR-managed lists).
const DEPARTMENTS = [
  { name: 'Engineering', description: 'Product engineering & platform' },
  { name: 'Operations', description: 'Business operations' },
  { name: 'People', description: 'HR & people operations' },
];
const POSITIONS = [
  { name: 'Software Engineer', department: 'Engineering' },
  { name: 'Engineering Manager', department: 'Engineering' },
  { name: 'Operations Executive', department: 'Operations' },
  { name: 'HR Manager', department: 'People' },
];

const POLICIES = [
  {
    title: 'Leave & Time-Off Policy',
    category: 'LEAVE',
    summary: 'Casual, sick and earned leave entitlements, accrual and the approval workflow.',
    effectiveDate: new Date(YEAR, 0, 1),
  },
  {
    title: 'Code of Conduct',
    category: 'CONDUCT',
    summary: 'Expected workplace behaviour, anti-harassment and conflict-of-interest rules.',
    effectiveDate: new Date(YEAR, 0, 1),
  },
  {
    title: 'Acceptable Use of IT',
    category: 'IT',
    summary: 'Rules for company devices, accounts, data handling and security hygiene.',
    effectiveDate: new Date(YEAR, 2, 15),
  },
  {
    title: 'Reimbursement & Expenses',
    category: 'FINANCE',
    summary: 'What is reimbursable, claim limits and the submission process.',
    effectiveDate: new Date(YEAR, 3, 1),
  },
  {
    title: 'Remote & Hybrid Work',
    category: 'GENERAL',
    summary: 'Eligibility, expectations and attendance rules for remote and hybrid work.',
    effectiveDate: new Date(YEAR, 5, 1),
  },
];

const HOLIDAYS = [
  { name: "New Year's Day", month: 0, day: 1, type: 'PUBLIC' },
  { name: 'Republic Day', month: 0, day: 26, type: 'PUBLIC' },
  { name: 'Holi', month: 2, day: 25, type: 'OPTIONAL' },
  { name: 'Independence Day', month: 7, day: 15, type: 'PUBLIC' },
  { name: 'Gandhi Jayanti', month: 9, day: 2, type: 'PUBLIC' },
  { name: 'Diwali', month: 10, day: 1, type: 'PUBLIC' },
  { name: 'Founders Day', month: 10, day: 20, type: 'RESTRICTED' },
  { name: 'Christmas', month: 11, day: 25, type: 'PUBLIC' },
];

const STRUCTURE = {
  currency: 'INR',
  basic: 60000,
  hra: 24000,
  allowances: 16000,
  deductions: 8000,
};
const GROSS = STRUCTURE.basic + STRUCTURE.hra + STRUCTURE.allowances;
const NET = GROSS - STRUCTURE.deductions;

const TICKETS = [
  {
    subject: 'Laptop running slow',
    category: 'IT',
    priority: 'MEDIUM',
    description: 'My work laptop has been slow since the last update. Requesting a check.',
    status: 'IN_PROGRESS',
  },
  {
    subject: 'Payslip download issue',
    category: 'PAYROLL',
    priority: 'LOW',
    description: 'Last month payslip did not open. Can you re-share it?',
    status: 'OPEN',
  },
];

/** Idempotently seeds company-wide + per-employee demo data for the workspace views. */
export async function seedEmployeeData(): Promise<void> {
  for (const d of DEPARTMENTS) {
    await DepartmentModel.updateOne({ name: d.name }, { $setOnInsert: d }, { upsert: true });
  }
  for (const p of POSITIONS) {
    await PositionModel.updateOne(
      { name: p.name, department: p.department },
      { $setOnInsert: p },
      { upsert: true },
    );
  }

  if ((await PolicyModel.estimatedDocumentCount()) === 0) {
    await PolicyModel.insertMany(POLICIES);
    logger.info(`Seeded ${POLICIES.length} policies`);
  }

  for (const h of HOLIDAYS) {
    await HolidayModel.updateOne(
      { name: h.name, date: new Date(YEAR, h.month, h.day) },
      { $setOnInsert: { name: h.name, date: new Date(YEAR, h.month, h.day), type: h.type } },
      { upsert: true },
    );
  }

  const users = await UserModel.find().select('_id').lean();
  for (const user of users) {
    const employeeId = user._id.toString();

    await SalaryStructureModel.updateOne(
      { employeeId },
      { $setOnInsert: { employeeId, ...STRUCTURE, effectiveFrom: new Date(YEAR, 0, 1) } },
      { upsert: true },
    );

    for (let offset = 1; offset <= 3; offset++) {
      const d = new Date(YEAR, new Date().getMonth() - offset, 28);
      await SalarySlipModel.updateOne(
        { employeeId, year: d.getFullYear(), month: d.getMonth() + 1 },
        {
          $setOnInsert: {
            employeeId,
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            currency: STRUCTURE.currency,
            gross: GROSS,
            deductions: STRUCTURE.deductions,
            net: NET,
            status: 'PAID',
            issuedDate: d,
          },
        },
        { upsert: true },
      );
    }

    if ((await SupportTicketModel.countDocuments({ employeeId })) === 0) {
      await SupportTicketModel.insertMany(TICKETS.map((t) => ({ ...t, employeeId })));
    }
  }
  logger.info(`Seeded workspace data for ${users.length} user(s)`);
}
