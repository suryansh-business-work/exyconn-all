import gql from 'graphql-tag';

export const licencesTypeDefs = gql`
  enum LicenceBillingCycle {
    MONTHLY
    QUARTERLY
    YEARLY
  }

  enum LicenceStatus {
    ACTIVE
    CANCELLED
  }

  "A software subscription IT pays for: a pot of seats that renews on a date."
  type Licence {
    id: ID!
    name: String!
    vendor: String!
    seatsTotal: Int!
    "Employees holding a seat. Its length is the seats used."
    assigneeIds: [String!]!
    cost: Float!
    billingCycle: LicenceBillingCycle!
    renewalDate: DateTime!
    status: LicenceStatus!
    notes: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input LicenceInput {
    name: String!
    vendor: String!
    seatsTotal: Int!
    assigneeIds: [String!]
    cost: Float!
    billingCycle: LicenceBillingCycle!
    renewalDate: DateTime!
    status: LicenceStatus!
    notes: String
  }

  type LicencePage {
    rows: [Licence!]!
    totalCount: Int!
  }

  extend type Query {
    listLicences: [Licence!]!
    listLicencesPaged(input: TableQueryInput!): LicencePage!
    listLicencesStats: TableStats!
    getLicence(id: ID!): Licence!
  }

  extend type Mutation {
    createLicence(input: LicenceInput!): Licence!
    updateLicence(id: ID!, input: LicenceInput!): Licence!
    deleteLicence(id: ID!): Boolean!
  }
`;
