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

  "How an employee is paid. Decides which amounts on the salary structure mean anything."
  enum PayType {
    FIXED
    HOURLY
    STIPEND
    OTHER
  }

  "The signed-in employee's salary structure. gross/net are derived server-side."
  type SalaryStructure {
    id: ID!
    employeeId: String!
    currency: String!
    payType: PayType!
    "What OTHER means for this person; empty for the named pay types."
    payTypeNote: String
    "FIXED only: the monthly components. Zero for every other pay type."
    basic: Float!
    hra: Float!
    allowances: Float!
    deductions: Float!
    """
    The single amount the non-FIXED types are paid at: per HOUR for HOURLY, per MONTH for
    STIPEND and OTHER. Ignored for FIXED, whose money is in the components above.
    """
    rate: Float!
    """
    What an hour of this person's tracked time is BILLED at — always per hour, whatever they
    are paid. This is the number the tracker's billing report multiplies hours by.
    """
    billingRate: Float!
    "Monthly gross for the pay type. Zero for HOURLY, which earns per tracked hour."
    gross: Float!
    net: Float!
    """
    This employee's own statutory position, each overriding the company payroll settings:
    whether PF and ESI apply to them at all, and their own TDS rate (0 = use the company's).
    """
    pfApplicable: Boolean!
    esiApplicable: Boolean!
    tdsPercent: Float!
    "Statutory identifiers, printed on the payslip when they are on file."
    pfNumber: String
    esiNumber: String
    panNumber: String
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
    """
    The deductions total: the employee's own fixed deductions, loss of pay, and every
    statutory line below. Kept as the single total so every existing reader stays correct.
    """
    deductions: Float!
    "Employee provident fund withheld this month."
    pf: Float!
    "Employee state insurance withheld this month."
    esi: Float!
    professionalTax: Float!
    "Income tax withheld at source."
    tds: Float!
    "The employee's own fixed deductions, from their salary structure."
    otherDeductions: Float!
    net: Float!
    status: SlipStatus!
    issuedDate: DateTime!
    "The day the salary actually left the company. Null until the month is marked paid."
    paidOn: DateTime
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
    "Screenshots or documents, already uploaded through uploadImage."
    attachments: [TicketAttachmentInput!]
  }

  extend type Query {
    "Self-service: the signed-in employee's salary structure (null if unset)."
    myPayroll: SalaryStructure
    "Self-service: the signed-in employee's monthly payslips."
    mySalarySlips: [SalarySlip!]!
    "The signed-in employee's own support tickets."
    mySupportTickets: [SupportTicket!]!
    "The conversation on one of the employee's own tickets, internal notes excluded."
    mySupportReplies(ticketId: ID!): [SupportReply!]!
    "Company-wide holidays, readable by any authenticated employee."
    listHolidays: [Holiday!]!
  }

  extend type Mutation {
    "Self-service: raise a support ticket (status forced to OPEN)."
    createSupportTicket(input: SupportTicketInput!): SupportTicket!
    "Self-service: continue the conversation on one of the employee's own tickets."
    addMySupportReply(
      ticketId: ID!
      body: String!
      attachments: [TicketAttachmentInput!]
    ): SupportReply!
  }
`;
