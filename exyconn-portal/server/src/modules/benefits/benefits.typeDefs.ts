import gql from 'graphql-tag';

export const benefitsTypeDefs = gql`
  enum BenefitKind {
    INSURANCE
    PF
    GRATUITY
    WELLNESS
    OTHER
  }

  type Benefit {
    id: ID!
    employeeId: String!
    kind: BenefitKind!
    name: String!
    provider: String!
    reference: String!
    coverage: String!
    validFrom: DateTime
    validTo: DateTime
    documentUrl: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input BenefitInput {
    employeeId: String!
    kind: BenefitKind!
    name: String!
    provider: String!
    reference: String!
    coverage: String!
    validFrom: DateTime
    validTo: DateTime
    documentUrl: String
  }

  type BenefitPage {
    rows: [Benefit!]!
    totalCount: Int!
  }

  extend type Query {
    listBenefits: [Benefit!]!
    listBenefitsPaged(input: TableQueryInput!): BenefitPage!
    listBenefitsStats: TableStats!
    getBenefit(id: ID!): Benefit!
    myBenefits: [Benefit!]!
  }

  extend type Mutation {
    createBenefit(input: BenefitInput!): Benefit!
    updateBenefit(id: ID!, input: BenefitInput!): Benefit!
    deleteBenefit(id: ID!): Boolean!
  }
`;
