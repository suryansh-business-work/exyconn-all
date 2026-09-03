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
    basic: Float!
    hra: Float!
    allowances: Float!
    deductions: Float!
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

  extend type Query {
    listSalaryStructures: [SalaryStructure!]!
    listSalaryStructuresPaged(input: TableQueryInput!): SalaryStructurePage!
    listSalaryStructuresStats: TableStats!
    getSalaryStructure(id: ID!): SalaryStructure!
    listSalarySlipsPaged(input: TableQueryInput!): SalarySlipPage!
    listSalarySlipsStats: TableStats!
    payrollSummary(month: Int!, year: Int!): PayrollSummary!
  }

  extend type Mutation {
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
  }
`;
