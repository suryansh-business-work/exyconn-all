import gql from 'graphql-tag';

/**
 * Employee self-service schema: the signed-in employee's payroll, payslips,
 * support tickets, and the company-wide policies & holidays they can read.
 */
export const employeeTypeDefs = gql`
  enum SlipStatus {
    GENERATED
    PAID
  }
  enum HolidayType {
    PUBLIC
    OPTIONAL
    RESTRICTED
  }
  enum SupportCategory {
    IT
    HR
    PAYROLL
    FACILITIES
    OTHER
  }
  enum SupportPriority {
    LOW
    MEDIUM
    HIGH
  }
  enum SupportStatus {
    OPEN
    IN_PROGRESS
    RESOLVED
    CLOSED
  }

  "The signed-in employee's salary structure. gross/net are derived server-side."
  type SalaryStructure {
    id: ID!
    employeeId: String!
    currency: String!
    basic: Float!
    hra: Float!
    allowances: Float!
    deductions: Float!
    gross: Float!
    net: Float!
    effectiveFrom: DateTime!
    updatedAt: DateTime!
  }

  type SalarySlip {
    id: ID!
    employeeId: String!
    month: Int!
    year: Int!
    currency: String!
    gross: Float!
    deductions: Float!
    net: Float!
    status: SlipStatus!
    issuedDate: DateTime!
  }

  type Holiday {
    id: ID!
    name: String!
    date: DateTime!
    type: HolidayType!
    description: String
  }

  type SupportTicket {
    id: ID!
    employeeId: String!
    "Resolved display name of the employee — populated by the support console."
    employeeName: String
    subject: String!
    category: SupportCategory!
    description: String!
    priority: SupportPriority!
    status: SupportStatus!
    "Support-team member who owns it. Empty until someone picks it up."
    assigneeId: String!
    assigneeName: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "Employee-facing support request — the server sets employeeId and OPEN status."
  input SupportTicketInput {
    subject: String!
    category: SupportCategory!
    description: String!
    priority: SupportPriority!
  }

  extend type Query {
    "Self-service: the signed-in employee's salary structure (null if unset)."
    myPayroll: SalaryStructure
    "Self-service: the signed-in employee's monthly payslips."
    mySalarySlips: [SalarySlip!]!
    "The signed-in employee's own support tickets."
    mySupportTickets: [SupportTicket!]!
    "Company-wide holidays, readable by any authenticated employee."
    listHolidays: [Holiday!]!
  }

  extend type Mutation {
    "Self-service: raise a support ticket (status forced to OPEN)."
    createSupportTicket(input: SupportTicketInput!): SupportTicket!
  }
`;
