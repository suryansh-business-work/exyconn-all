import { SalarySlipModel } from '../employee/salarySlip.model';
import { SalaryStructureModel } from '../employee/salary.model';
import { UserModel } from '../admin/user.model';
import { BrandingModel } from '../branding/branding.model';
import { emailer } from '../email';
import { buildPayslipPdf, formatAmount, periodLabel, type PayslipData } from './payslip.pdf';
import { payslipFilename } from './payslip.lines';
import { notFound } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

/** A payslip rendered and ready to hand over — to a download or to an email. */
export interface RenderedPayslip {
  filename: string;
  pdf: Buffer;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  period: string;
  netPay: string;
  status: string;
}

/** What one dispatch run did, per employee outcome. */
export interface PayrollDispatchResult {
  month: number;
  year: number;
  sent: number;
  failed: number;
  skipped: number;
}

interface SlipRow {
  _id: unknown;
  employeeId: string;
  month: number;
  year: number;
  currency: string;
  gross: number;
  deductions: number;
  net: number;
  status: string;
  issuedDate: Date;
}

/** Gathers everything one payslip prints and renders it. Never partial: no row, no PDF. */
async function render(slip: SlipRow): Promise<RenderedPayslip> {
  const [employee, structure, branding] = await Promise.all([
    UserModel.findById(slip.employeeId).select('name email designation department joinDate').lean(),
    SalaryStructureModel.findOne({ employeeId: slip.employeeId }).lean(),
    BrandingModel.findOne().lean(),
  ]);
  if (!employee) {
    notFound('The employee this payslip belongs to');
  }

  const data: PayslipData = {
    company: {
      name: branding?.businessName ?? 'Exyconn',
      address: branding?.address ?? '',
      supportEmail: branding?.supportEmail ?? '',
    },
    employee: {
      name: employee.name,
      email: employee.email,
      designation: employee.designation ?? '',
      department: employee.department ?? '',
      joinDate: employee.joinDate ?? null,
    },
    slip: {
      month: slip.month,
      year: slip.year,
      currency: slip.currency,
      gross: slip.gross,
      deductions: slip.deductions,
      net: slip.net,
      status: slip.status,
      issuedDate: slip.issuedDate,
    },
    structure: structure
      ? {
          basic: structure.basic,
          hra: structure.hra,
          allowances: structure.allowances,
          deductions: structure.deductions,
        }
      : null,
  };

  return {
    filename: payslipFilename(employee.name, slip.year, slip.month),
    pdf: await buildPayslipPdf(data),
    employeeId: slip.employeeId,
    employeeName: employee.name,
    employeeEmail: employee.email,
    period: periodLabel(slip.month, slip.year),
    netPay: formatAmount(slip.net, slip.currency),
    status: slip.status,
  };
}

/** One payslip by id, rendered. The employee download, the HR download and the email all use this. */
export async function renderPayslip(slipId: string): Promise<RenderedPayslip> {
  const slip = await SalarySlipModel.findById(slipId).lean();
  if (!slip) {
    notFound('Salary slip');
  }
  return render(slip as unknown as SlipRow);
}

/** Emails one already-rendered payslip to the employee it belongs to. */
async function mailPayslip(payslip: RenderedPayslip, triggeredBy: string): Promise<void> {
  await emailer.send({
    template: 'salary-slip',
    to: payslip.employeeEmail,
    triggeredBy,
    variables: {
      name: payslip.employeeName,
      period: payslip.period,
      netPay: payslip.netPay,
      status: payslip.status,
      slipsUrl: env.salarySlipsUrl,
    },
    attachments: [{ filename: payslip.filename, content: payslip.pdf }],
  });
}

/**
 * Emails every payslip of one month, each with its own PDF attached.
 *
 * One employee's failure — a bounced address, a deleted account — is counted and the run
 * carries on: stopping would leave the rest of the company without a payslip because of
 * somebody else's mailbox.
 */
export async function dispatchSalarySlips(
  month: number,
  year: number,
  triggeredBy: string,
): Promise<PayrollDispatchResult> {
  const slips = (await SalarySlipModel.find({ month, year }).lean()) as unknown as SlipRow[];
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const slip of slips) {
    try {
      const payslip = await render(slip);
      if (!payslip.employeeEmail) {
        skipped += 1;
        continue;
      }
      await mailPayslip(payslip, triggeredBy);
      sent += 1;
    } catch (error) {
      failed += 1;
      logger.error(error, `Payslip email for employee ${slip.employeeId} failed`);
    }
  }

  logger.info(
    `Payslip dispatch for ${month}/${year}: ${sent} sent, ${failed} failed, ${skipped} skipped`,
  );
  return { month, year, sent, failed, skipped };
}
