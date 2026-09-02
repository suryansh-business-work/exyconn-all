import gql from 'graphql-tag';

/** HR master data: holiday administration, leave types and leave balances. */
export const hrMasterTypeDefs = gql`
  # Holiday itself is declared by the employee module, which reads it. This adds
  # the HR-side administration of the same records.
  input HolidayInput {
    name: String!
    date: DateTime!
    type: HolidayType!
    description: String
  }

  type HolidayPage {
    rows: [Holiday!]!
    totalCount: Int!
  }

  type LeavePolicy {
    id: ID!
    name: String!
    code: String!
    annualQuota: Int!
    paid: Boolean!
    halfDayAllowed: Boolean!
    carryForwardCap: Int!
    active: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input LeavePolicyInput {
    name: String!
    code: String!
    annualQuota: Int!
    paid: Boolean!
    halfDayAllowed: Boolean!
    carryForwardCap: Int!
    active: Boolean!
  }

  type LeavePolicyPage {
    rows: [LeavePolicy!]!
    totalCount: Int!
  }

  type LeaveBalance {
    id: ID!
    employeeId: String!
    leaveTypeCode: String!
    year: Int!
    allocated: Int!
    carriedForward: Int!
    used: Int!
    adjustment: Int!
    "allocated + carriedForward + adjustment - used"
    available: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input LeaveBalanceInput {
    employeeId: String!
    leaveTypeCode: String!
    year: Int!
    allocated: Int!
    carriedForward: Int!
    used: Int!
    adjustment: Int!
  }

  type LeaveBalancePage {
    rows: [LeaveBalance!]!
    totalCount: Int!
  }

  extend type Query {
    listHolidaysPaged(input: TableQueryInput!): HolidayPage!
    listHolidaysStats: TableStats!
    getHoliday(id: ID!): Holiday!

    listLeavePolicies: [LeavePolicy!]!
    listLeavePoliciesPaged(input: TableQueryInput!): LeavePolicyPage!
    listLeavePoliciesStats: TableStats!
    getLeavePolicy(id: ID!): LeavePolicy!
    "Leave types an employee can pick from when applying."
    activeLeavePolicies: [LeavePolicy!]!

    listLeaveBalances: [LeaveBalance!]!
    listLeaveBalancesPaged(input: TableQueryInput!): LeaveBalancePage!
    listLeaveBalancesStats: TableStats!
    getLeaveBalance(id: ID!): LeaveBalance!
    "This employee's own balances for the current year."
    myLeaveBalances: [LeaveBalance!]!
  }

  extend type Mutation {
    createHoliday(input: HolidayInput!): Holiday!
    updateHoliday(id: ID!, input: HolidayInput!): Holiday!
    deleteHoliday(id: ID!): Boolean!

    createLeavePolicy(input: LeavePolicyInput!): LeavePolicy!
    updateLeavePolicy(id: ID!, input: LeavePolicyInput!): LeavePolicy!
    deleteLeavePolicy(id: ID!): Boolean!

    createLeaveBalance(input: LeaveBalanceInput!): LeaveBalance!
    updateLeaveBalance(id: ID!, input: LeaveBalanceInput!): LeaveBalance!
    deleteLeaveBalance(id: ID!): Boolean!
  }
`;
