import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import {
  dispatchSalarySlips,
  renderPayslip,
} from '../../../../src/modules/payroll/payroll.dispatch';
import { SalarySlipModel } from '../../../../src/modules/employee/salarySlip.model';
import { SalaryStructureModel } from '../../../../src/modules/employee/salary.model';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { BrandingModel } from '../../../../src/modules/branding/branding.model';
import { emailer } from '../../../../src/modules/email';
import { env } from '../../../../src/config/env';
import { logger } from '../../../../src/utils/logger';
import { ROLES } from '../../../../src/constants/roles';
import { seedUser, useTestOrganization } from '../../../helpers';

useTestOrganization({ currency: 'INR', locale: 'en-IN', taxSystem: 'INDIA_GST' });

async function employee(email: string, fields: Record<string, unknown> = {}) {
  const user = await seedUser(email, randomUUID(), [ROLES.EMPLOYEE]);
  await UserModel.updateOne({ _id: user._id }, { name: 'Ravi Kumar', ...fields });
  return String(user._id);
}

const slipFor = (employeeId: string, extra: Record<string, unknown> = {}) =>
  SalarySlipModel.create({
    employeeId,
    month: 8,
    year: 2026,
    currency: 'INR',
    gross: 80_000,
    deductions: 5_000,
    net: 75_000,
    issuedDate: new Date('2026-08-31T00:00:00.000Z'),
    ...extra,
  });

let send: jest.SpyInstance;
beforeEach(() => {
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('renderPayslip', () => {
  it('refuses a slip that does not exist', async () => {
    await expect(renderPayslip(String(new Types.ObjectId()))).rejects.toThrow(
      'Salary slip not found',
    );
  });

  it('refuses a slip whose employee is gone, rather than printing half a payslip', async () => {
    const slip = await slipFor(String(new Types.ObjectId()));
    await expect(renderPayslip(String(slip._id))).rejects.toThrow(
      'The employee this payslip belongs to not found',
    );
  });

  it('renders the slip under the employee’s name with the period and net pay', async () => {
    const id = await employee('ravi@exyconn.com', {
      designation: 'Engineer',
      department: 'Tech',
      joinDate: new Date('2024-04-01T00:00:00.000Z'),
    });
    await SalaryStructureModel.create({
      employeeId: id,
      currency: 'INR',
      basic: 50_000,
      hra: 20_000,
      allowances: 10_000,
      deductions: 5_000,
      pfNumber: 'PF/1',
      effectiveFrom: new Date('2024-04-01T00:00:00.000Z'),
    });
    await BrandingModel.create({ businessName: 'Acme Payroll', address: '1 Main Street' });
    const slip = await slipFor(id, { status: 'PAID' });

    const payslip = await renderPayslip(String(slip._id));

    expect(payslip).toMatchObject({
      filename: 'Payslip-Ravi-Kumar-2026-08.pdf',
      employeeId: id,
      employeeName: 'Ravi Kumar',
      employeeEmail: 'ravi@exyconn.com',
      period: 'August 2026',
      status: 'PAID',
    });
    expect(payslip.netPay).toContain('75,000');
    expect(payslip.pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(payslip.pdf.toString('latin1')).toContain('(Acme Payroll)');
  });

  it('still renders a slip from before statutory lines, with no structure or branding', async () => {
    const id = await employee('bare@exyconn.com');
    const slip = await slipFor(id);
    await SalarySlipModel.collection.updateOne(
      { _id: slip._id },
      { $unset: { pf: '', esi: '', professionalTax: '', tds: '' } },
    );

    const payslip = await renderPayslip(String(slip._id));

    expect(payslip.status).toBe('GENERATED');
    expect(payslip.netPay).toContain('75,000');
    expect(payslip.pdf.toString('latin1')).toContain('(Exyconn)');
  });
});

describe('dispatchSalarySlips', () => {
  it('emails each payslip of the month with its own PDF attached', async () => {
    const id = await employee('ravi@exyconn.com');
    await slipFor(id);
    await slipFor(id, { month: 7 });

    const result = await dispatchSalarySlips(8, 2026, 'hr@exyconn.com');

    expect(result).toEqual({ month: 8, year: 2026, sent: 1, failed: 0, skipped: 0 });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({
      template: 'salary-slip',
      to: 'ravi@exyconn.com',
      triggeredBy: 'hr@exyconn.com',
      variables: expect.objectContaining({
        name: 'Ravi Kumar',
        period: 'August 2026',
        status: 'GENERATED',
        slipsUrl: env.salarySlipsUrl,
      }),
      attachments: [{ filename: 'Payslip-Ravi-Kumar-2026-08.pdf', content: expect.any(Buffer) }],
    });
  });

  it('skips an employee with no address and counts a failure without stopping the run', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const noEmail = await employee('nomail@exyconn.com');
    await UserModel.collection.updateOne(
      { _id: new Types.ObjectId(noEmail) },
      { $set: { email: '' } },
    );
    const ghost = String(new Types.ObjectId());
    const bounced = await employee('bounce@exyconn.com');
    const fine = await employee('fine@exyconn.com');
    await Promise.all([slipFor(noEmail), slipFor(ghost), slipFor(bounced), slipFor(fine)]);
    send.mockImplementation(async ({ to }: { to: string }) => {
      if (to === 'bounce@exyconn.com') {
        throw new Error('mailbox full');
      }
    });

    const result = await dispatchSalarySlips(8, 2026, 'payroll schedule');

    expect(result).toEqual({ month: 8, year: 2026, sent: 1, failed: 2, skipped: 1 });
    expect(send).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalledWith(
      expect.any(Error),
      `Payslip email for employee ${ghost} failed`,
    );
    expect(error).toHaveBeenCalledWith(
      expect.any(Error),
      `Payslip email for employee ${bounced} failed`,
    );
  });

  it('sends nothing for a month with no slips', async () => {
    await expect(dispatchSalarySlips(1, 2026, 'hr@exyconn.com')).resolves.toEqual({
      month: 1,
      year: 2026,
      sent: 0,
      failed: 0,
      skipped: 0,
    });
    expect(send).not.toHaveBeenCalled();
  });
});
