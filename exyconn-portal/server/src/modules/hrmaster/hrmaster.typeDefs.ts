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
    "ISO 3166-1 alpha-2, or empty for a holiday the whole company observes."
    country: String!
    "Countries that do not observe a company-wide holiday. Ignored on a country holiday."
    excludedCountries: [String!]!
    "Cities of the country that observe it; empty for the whole country. Ignored on a global one."
    cities: [String!]!
  }

  type HolidayPage {
    rows: [Holiday!]!
    totalCount: Int!
  }

  "One country's own terms for a leave type, replacing the global ones there."
  type LeavePolicyOverride {
    country: String!
    annualQuota: Int!
    carryForwardCap: Int!
    "Offered in this country — true even when the global type is off (a local-only type)."
    active: Boolean!
  }

  input LeavePolicyOverrideInput {
    country: String!
    annualQuota: Int!
    carryForwardCap: Int!
    active: Boolean!
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
    "Per-country terms; a country with no row gets the global ones."
    overrides: [LeavePolicyOverride!]!
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
    overrides: [LeavePolicyOverrideInput!]!
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
    "The holidays the signed-in employee observes: company-wide ones plus their country's and city's."
    myHolidays: [Holiday!]!
    "One employee's balances for a year, every type their country offers filled in. HR."
    employeeLeaveBalances(employeeId: ID!, year: Int!): [LeaveBalance!]!

    listLeavePolicies: [LeavePolicy!]!
    listLeavePoliciesPaged(input: TableQueryInput!): LeavePolicyPage!
    listLeavePoliciesStats: TableStats!
    getLeavePolicy(id: ID!): LeavePolicy!
    """
    Leave types the signed-in employee can pick from when applying, with quota and
    carry-forward already resolved for their country.
    """
    activeLeavePolicies: [LeavePolicy!]!

    listLeaveBalances: [LeaveBalance!]!
    listLeaveBalancesPaged(input: TableQueryInput!): LeaveBalancePage!
    listLeaveBalancesStats: TableStats!
    getLeaveBalance(id: ID!): LeaveBalance!
    """
    This employee's own balances. The current year's are created on first read from the
    quota of every leave type offered in their country.
    """
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
