import gql from 'graphql-tag';

/**
 * Payroll administration. `SalaryStructure`, `SalarySlip` and `SlipStatus` are
 * declared by the employee module (which reads them); this adds the HR/Finance
 * side: salary structures, the payroll run, review and marking paid.
 */
export const payrollTypeDefs = gql`
  input SalaryStructureInput {
    employeeId: String!
    currency: String!
    payType: PayType
    payTypeNote: String
    basic: Float!
    hra: Float!
    allowances: Float!
    deductions: Float!
    "Per hour for HOURLY, per month for STIPEND and OTHER. Ignored by FIXED."
    rate: Float
    "Per hour, always — what the tracker bills this person's time at."
    billingRate: Float
    effectiveFrom: DateTime!
  }

  "The same fields without employeeId, which saveEmployeeSalary takes as its own argument."
  input EmployeeSalaryInput {
    currency: String!
    payType: PayType
    payTypeNote: String
    basic: Float!
    hra: Float!
    allowances: Float!
    deductions: Float!
    rate: Float
    billingRate: Float
    effectiveFrom: DateTime!
  }

  type SalaryStructurePage {
    rows: [SalaryStructure!]!
    totalCount: Int!
  }

  type SalarySlipPage {
    rows: [SalarySlip!]!
    totalCount: Int!
  }

  "What one payroll run did."
  type PayrollRunResult {
    month: Int!
    year: Int!
    "Slips created for the first time."
    generated: Int!
    "Slips that already existed and were recomputed (only while still GENERATED)."
    updated: Int!
    "Employees skipped: no salary structure, inactive, or slip already PAID."
    skipped: Int!
    totalNet: Float!
  }

  "The month at a glance, for review before marking paid."
  type PayrollSummary {
    month: Int!
    year: Int!
    slips: Int!
    paid: Int!
    totalGross: Float!
    totalDeductions: Float!
    totalNet: Float!
  }

  "When payslip emails go out, as HR configures them."
  type PayrollSchedule {
    enabled: Boolean!
    "Day of the month the run fires on. Capped at 28 so every month has it."
    dayOfMonth: Int!
    hour: Int!
    minute: Int!
    "Which month the run sends: PREVIOUS_MONTH or CURRENT_MONTH."
    period: String!
    lastRunAt: DateTime
    "The period the last run sent for, as YYYY-MM. Empty until the first run."
    lastRunPeriod: String!
    lastSent: Int!
    lastFailed: Int!
    lastSkipped: Int!
  }

  input PayrollScheduleInput {
    enabled: Boolean!
    dayOfMonth: Int!
    hour: Int!
    minute: Int!
    period: String!
  }

  "What one payslip email run did, per employee outcome."
  type PayrollDispatchResult {
    month: Int!
    year: Int!
    sent: Int!
    "Employees whose payslip email was refused; the run carried on past each one."
    failed: Int!
    "Employees with no email address on file."
    skipped: Int!
  }

  "A payslip PDF, base64 encoded so the browser can save it straight from the response."
  type SalarySlipDownload {
    filename: String!
    contentType: String!
    contentBase64: String!
  }

  extend type Query {
    listSalaryStructures: [SalaryStructure!]!
    listSalaryStructuresPaged(input: TableQueryInput!): SalaryStructurePage!
    listSalaryStructuresStats: TableStats!
    getSalaryStructure(id: ID!): SalaryStructure!
    """
    ONE employee's salary structure, looked up by the employee rather than by structure id.
    Null until HR has set one up. This is what the employee record reads.
    """
    employeeSalary(employeeId: ID!): SalaryStructure
    listSalarySlipsPaged(input: TableQueryInput!): SalarySlipPage!
    listSalarySlipsStats: TableStats!
    payrollSummary(month: Int!, year: Int!): PayrollSummary!
    "The payslip email schedule. Created with its defaults on first read."
    payrollSchedule: PayrollSchedule!
    """
    One payslip as a PDF. An employee may download their own; HR and Finance may
    download anyone's.
    """
    salarySlipPdf(id: ID!): SalarySlipDownload!
  }

  extend type Mutation {
    """
    Creates or replaces ONE employee's salary structure, keyed on the employee.

    An upsert, because employeeId is unique and the HR employee form saves compensation
    alongside the rest of the record — it has no business knowing whether a structure
    already exists, and guessing wrong would fail the save on a duplicate key.
    """
    saveEmployeeSalary(employeeId: ID!, input: EmployeeSalaryInput!): SalaryStructure!
    createSalaryStructure(input: SalaryStructureInput!): SalaryStructure!
    updateSalaryStructure(id: ID!, input: SalaryStructureInput!): SalaryStructure!
    deleteSalaryStructure(id: ID!): Boolean!
    """
    Generates (or recomputes) every active employee's slip for the month from their
    salary structure and approved unpaid leave. Idempotent: running it twice
    recomputes GENERATED slips and never touches PAID ones.
    """
    runPayroll(month: Int!, year: Int!): PayrollRunResult!
    "Marks every GENERATED slip of the month PAID. Returns how many changed."
    markPayrollPaid(month: Int!, year: Int!): Int!
    "Saves when payslip emails go out. Turning it off stops the scheduled run."
    updatePayrollSchedule(input: PayrollScheduleInput!): PayrollSchedule!
    """
    Emails every payslip of the month to its employee, PDF attached, right now.
    Does not wait for the schedule and does not change it.
    """
    sendSalarySlips(month: Int!, year: Int!): PayrollDispatchResult!
  }
`;
