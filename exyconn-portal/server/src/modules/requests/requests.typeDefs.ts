import gql from 'graphql-tag';

export const requestsTypeDefs = gql`
  enum RequestType {
    WFH
    REGULARIZATION
    DOCUMENT
    PROFILE_CHANGE
    REIMBURSEMENT
    TRAVEL
    OTHER
  }

  enum RequestStatus {
    PENDING
    APPROVED
    REJECTED
  }

  type EmployeeRequest {
    id: ID!
    employeeId: String!
    type: RequestType!
    subject: String!
    details: String!
    status: RequestStatus!
    decisionNote: String
    decidedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input EmployeeRequestInput {
    employeeId: String!
    type: RequestType!
    subject: String!
    details: String!
    status: RequestStatus!
    decisionNote: String
  }

  input MyRequestInput {
    type: RequestType!
    subject: String!
    details: String!
  }

  type EmployeeRequestPage {
    rows: [EmployeeRequest!]!
    totalCount: Int!
  }

  extend type Query {
    listEmployeeRequests: [EmployeeRequest!]!
    listEmployeeRequestsPaged(input: TableQueryInput!): EmployeeRequestPage!
    listEmployeeRequestsStats: TableStats!
    getEmployeeRequest(id: ID!): EmployeeRequest!
    myRequests: [EmployeeRequest!]!
  }

  extend type Mutation {
    createEmployeeRequest(input: EmployeeRequestInput!): EmployeeRequest!
    updateEmployeeRequest(id: ID!, input: EmployeeRequestInput!): EmployeeRequest!
    deleteEmployeeRequest(id: ID!): Boolean!
    """
    Raised by the employee for themselves — the employee id comes from the token,
    and the status always starts PENDING.
    """
    createMyRequest(input: MyRequestInput!): EmployeeRequest!
  }
`;
