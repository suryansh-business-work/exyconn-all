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
    "This employee's own statutory position, overriding the company payroll settings."
    pfApplicable: Boolean
    esiApplicable: Boolean
    "Percent of taxable pay withheld for this person; 0 falls back to the company rate."
    tdsPercent: Float
    pfNumber: String
    esiNumber: String
    panNumber: String
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
    pfApplicable: Boolean
    esiApplicable: Boolean
    tdsPercent: Float
    pfNumber: String
    esiNumber: String
    panNumber: String
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

  "What one payroll run did. A run either issues a slip to every employee picked or refuses."
  type PayrollRunResult {
    month: Int!
    year: Int!
    "Slips issued, one per employee picked."
    generated: Int!
    totalNet: Float!
  }

  """
  Where one active employee stands for a month's run. READY can be run; ALREADY_RUN has a
  slip for the month and is never run again; NO_STRUCTURE has no salary structure on file.
  """
  enum PayrollCandidateStatus {
    READY
    ALREADY_RUN
    NO_STRUCTURE
  }

  "One active employee in a run plan. Amounts are worked out for READY employees only."
  type PayrollCandidate {
    employeeId: ID!
    name: String!
    department: String
    designation: String
    status: PayrollCandidateStatus!
    "The existing slip's status, for ALREADY_RUN."
    slipStatus: SlipStatus
    gross: Float
    deductions: Float
    net: Float
    currency: String
  }

  "What running a month would do, employee by employee, before anything is written."
  type PayrollRunPlan {
    month: Int!
    year: Int!
    "Midnight, on the company clock, of the day this month opens for running."
    opensOn: DateTime!
    "Whether the month can be run now."
    open: Boolean!
    employees: [PayrollCandidate!]!
    readyCount: Int!
    alreadyRunCount: Int!
    noStructureCount: Int!
    "Totals over the READY employees."
    totalGross: Float!
    totalDeductions: Float!
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

  """
  One band of the TDS table.

  upTo is null for the open-ended top band. Rates are not compiled in: they change with
  every finance act, so the table is entered by whoever knows the current one.
  """
  type TdsSlab {
    upTo: Float
    percent: Float!
  }

  input TdsSlabInput {
    upTo: Float
    percent: Float!
  }

  """
  How TDS is worked out. NONE withholds nothing; FLAT_PERCENT takes a percentage of taxable
  pay; SLAB applies the band table below to the annualised pay. An employee with their own
  rate on file beats every mode except NONE, and an empty table withholds nothing rather
  than guessing.
  """
  enum TdsMode {
    NONE
    FLAT_PERCENT
    SLAB
  }

  "Company-wide statutory deduction policy. One document; every payslip is worked out from it."
  type PayrollSettings {
    pfEnabled: Boolean!
    pfEmployeePercent: Float!
    "PF is charged on basic only up to this figure; anything above it is exempt."
    pfWageCeiling: Float!
    esiEnabled: Boolean!
    esiEmployeePercent: Float!
    "ESI applies only while gross is at or below this figure."
    esiWageLimit: Float!
    professionalTaxMonthly: Float!
    tdsMode: TdsMode!
    tdsFlatPercent: Float!
    "The bands SLAB mode applies. Empty withholds nothing rather than guessing a rate."
    tdsSlabs: [TdsSlab!]!
    "Deducted from annual taxable pay before the bands are applied."
    tdsAnnualExemption: Float!
    "Charged on the TAX, not on the income. 0 where the jurisdiction has none."
    tdsCessPercent: Float!
    "Which regime in the tax-slab table SLAB mode applies. The year comes from the period run."
    tdsRegimeKey: String!
    "The month a financial year opens in, 1-12. April in India, 1 on a calendar tax year."
    financialYearStartMonth: Int!
    "A month's payroll can be run from this day of that month on, 1-28, on the company clock."
    runFromDay: Int!
  }

  input PayrollSettingsInput {
    pfEnabled: Boolean!
    pfEmployeePercent: Float!
    pfWageCeiling: Float!
    esiEnabled: Boolean!
    esiEmployeePercent: Float!
    esiWageLimit: Float!
    professionalTaxMonthly: Float!
    tdsMode: TdsMode!
    tdsFlatPercent: Float!
    tdsSlabs: [TdsSlabInput!]
    tdsAnnualExemption: Float
    tdsCessPercent: Float
    tdsRegimeKey: String
    financialYearStartMonth: Int
    runFromDay: Int
  }

  """
  One named income-tax regime for one financial year — "new regime", "old regime".

  Two regimes stand side by side because each carries its own standard deduction and rebate;
  the payroll settings name which key the next run applies. Nothing here is compiled in: the
  seeded table is one year's figures, to be checked against the finance act and edited here.
  """
  type TaxRegime {
    id: ID!
    "Short stable name, e.g. NEW or OLD. The slab rows point at this."
    regimeKey: String!
    "The financial year these figures are for, as 2026-27."
    financialYear: String!
    name: String!
    "Taken off annual pay before the bands are walked."
    standardDeduction: Float!
    "Taxable income at or below which the rebate applies."
    rebateIncomeLimit: Float!
    "The most tax the rebate can write off. Applied before cess, never below zero."
    rebateMaxTax: Float!
    "Charged on the TAX, not on the income."
    cessPercent: Float!
    "An inactive regime withholds nothing, so a half-entered table cannot tax anybody."
    active: Boolean!
  }

  input TaxRegimeInput {
    regimeKey: String!
    financialYear: String!
    name: String!
    standardDeduction: Float!
    rebateIncomeLimit: Float!
    rebateMaxTax: Float!
    cessPercent: Float!
    active: Boolean!
  }

  """
  One band of one regime's table. Both bounds are stored rather than derived from the
  neighbouring rows, so reordering the table never silently re-cuts the bands around it.
  """
  type TaxSlab {
    id: ID!
    regimeKey: String!
    financialYear: String!
    "Income above this falls in this band. The lowest band starts at 0."
    fromAmount: Float!
    "Income up to and including this is in this band. Null means everything above."
    toAmount: Float
    ratePercent: Float!
    "The order the bands are walked in, lowest first."
    order: Int!
    active: Boolean!
  }

  input TaxSlabInput {
    regimeKey: String!
    financialYear: String!
    fromAmount: Float!
    toAmount: Float
    ratePercent: Float!
    order: Int!
    active: Boolean!
  }

  type TaxSlabPage {
    rows: [TaxSlab!]!
    totalCount: Int!
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
    "Every active employee and whether the month can be run for them, with the figures it would store."
    payrollRunPlan(month: Int!, year: Int!): PayrollRunPlan!
    "The payslip email schedule. Created with its defaults on first read."
    payrollSchedule: PayrollSchedule!
    """
    One payslip as a PDF. An employee may download their own; HR and Finance may
    download anyone's.
    """
    salarySlipPdf(id: ID!): SalarySlipDownload!
    "The statutory deduction policy. Created with its defaults on first read."
    payrollSettings: PayrollSettings!
    "Every income-tax regime on file, both years and both regimes."
    listTaxRegimes: [TaxRegime!]!
    getTaxRegime(id: ID!): TaxRegime!
    listTaxSlabs: [TaxSlab!]!
    listTaxSlabsPaged(input: TableQueryInput!): TaxSlabPage!
    listTaxSlabsStats: TableStats!
    getTaxSlab(id: ID!): TaxSlab!
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
    Issues the month's slip to exactly the employees picked, from their salary structure and
    approved unpaid leave. Refused before the month opens (runFromDay in the payroll settings),
    with nobody picked, or if any one picked is inactive, has no salary structure or already
    has a slip for the month: a month run for an employee is never run again.
    """
    runPayroll(month: Int!, year: Int!, employeeIds: [ID!]!): PayrollRunResult!
    "Marks every GENERATED slip of the month PAID. Returns how many changed."
    markPayrollPaid(month: Int!, year: Int!): Int!
    "Saves when payslip emails go out. Turning it off stops the scheduled run."
    updatePayrollSchedule(input: PayrollScheduleInput!): PayrollSchedule!
    """
    Emails every payslip of the month to its employee, PDF attached, right now.
    Does not wait for the schedule and does not change it.
    """
    sendSalarySlips(month: Int!, year: Int!): PayrollDispatchResult!
    """
    Saves the statutory deduction policy. Applies to the NEXT payroll run — a slip already
    generated keeps the figures it was generated with, because that is what was withheld.
    """
    updatePayrollSettings(input: PayrollSettingsInput!): PayrollSettings!
    createTaxRegime(input: TaxRegimeInput!): TaxRegime!
    updateTaxRegime(id: ID!, input: TaxRegimeInput!): TaxRegime!
    deleteTaxRegime(id: ID!): Boolean!
    createTaxSlab(input: TaxSlabInput!): TaxSlab!
    updateTaxSlab(id: ID!, input: TaxSlabInput!): TaxSlab!
    deleteTaxSlab(id: ID!): Boolean!
  }
`;
