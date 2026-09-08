import { EmployeeDocumentModel } from './document.model';

/** Where an employee opens the payslip a document row stands for. */
const PAYSLIPS_PATH = '/me/salary-slips';

/**
 * Files a generated payslip under the employee's own documents.
 *
 * Keyed on the payslip rather than on the title, so a recomputed month updates the one row
 * it already has instead of filing a second copy: an employee looking at two payslips for
 * August has no way to tell which one they were paid.
 */
export async function ensurePayslipDocument(
  employeeId: string,
  salarySlipId: string,
  title: string,
  issuedOn: Date,
): Promise<void> {
  await EmployeeDocumentModel.updateOne(
    { salarySlipId },
    {
      $set: { employeeId, kind: 'SALARY_SLIP', title, url: PAYSLIPS_PATH, issuedOn },
      $setOnInsert: { salarySlipId },
    },
    { upsert: true },
  );
}
