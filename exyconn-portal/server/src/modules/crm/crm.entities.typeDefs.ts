import gql from 'graphql-tag';

/**
 * The accounts, people, opportunities and follow-ups that sit around a lead.
 * Kept in its own document so `crm.typeDefs.ts` stays the lead schema it was.
 */
export const crmEntitiesTypeDefs = gql`
  enum CompanyStatus {
    PROSPECT
    CUSTOMER
    PARTNER
    CHURNED
  }

  enum ContactStatus {
    ACTIVE
    UNSUBSCRIBED
    BOUNCED
    LEFT_COMPANY
  }

  enum DealStage {
    QUALIFYING
    DISCOVERY
    PROPOSAL
    NEGOTIATION
    WON
    LOST
  }

  enum ActivityType {
    CALL
    EMAIL
    MEETING
    NOTE
    TASK
  }

  enum ActivitySubject {
    DEAL
    CONTACT
    COMPANY
  }

  type Company {
    id: ID!
    name: String!
    domain: String!
    industry: String!
    "One of COMPANY_SIZES (11-50, and so on). A string, because 1-10 is not a valid enum name."
    size: String!
    status: CompanyStatus!
    phone: String!
    location: String!
    owner: String!
    notes: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Contact {
    id: ID!
    name: String!
    email: String!
    phone: String!
    title: String!
    companyId: String!
    companyName: String!
    status: ContactStatus!
    owner: String!
    notes: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Deal {
    id: ID!
    title: String!
    companyId: String!
    companyName: String!
    contactId: String!
    contactName: String!
    stage: DealStage!
    value: Float!
    "Percent, 0-100. With value, this gives the weighted pipeline figure."
    probability: Int!
    expectedCloseDate: DateTime
    owner: String!
    notes: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Activity {
    id: ID!
    type: ActivityType!
    subject: String!
    notes: String!
    relatedType: ActivitySubject!
    relatedId: String!
    relatedName: String!
    dueDate: DateTime
    done: Boolean!
    owner: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CompanyInput {
    name: String!
    domain: String!
    industry: String
    "One of COMPANY_SIZES (11-50, and so on). A string, because 1-10 is not a valid enum name."
    size: String!
    status: CompanyStatus!
    phone: String
    location: String
    owner: String!
    notes: String
  }

  input ContactInput {
    name: String!
    email: String!
    phone: String
    title: String
    companyId: String
    companyName: String
    status: ContactStatus!
    owner: String!
    notes: String
  }

  input DealInput {
    title: String!
    companyId: String
    companyName: String
    contactId: String
    contactName: String
    stage: DealStage!
    value: Float!
    probability: Int!
    expectedCloseDate: DateTime
    owner: String!
    notes: String
  }

  input ActivityInput {
    type: ActivityType!
    subject: String!
    notes: String
    relatedType: ActivitySubject!
    relatedId: String
    relatedName: String
    dueDate: DateTime
    done: Boolean!
    owner: String!
  }

  type CompanyPage {
    rows: [Company!]!
    totalCount: Int!
  }
  type ContactPage {
    rows: [Contact!]!
    totalCount: Int!
  }
  type DealPage {
    rows: [Deal!]!
    totalCount: Int!
  }
  type ActivityPage {
    rows: [Activity!]!
    totalCount: Int!
  }

  extend type Query {
    listCompanies: [Company!]!
    listCompaniesPaged(input: TableQueryInput!): CompanyPage!
    listCompaniesStats: TableStats!
    getCompany(id: ID!): Company!

    listContacts: [Contact!]!
    listContactsPaged(input: TableQueryInput!): ContactPage!
    listContactsStats: TableStats!
    getContact(id: ID!): Contact!

    listDeals: [Deal!]!
    listDealsPaged(input: TableQueryInput!): DealPage!
    listDealsStats: TableStats!
    getDeal(id: ID!): Deal!

    listActivities: [Activity!]!
    listActivitiesPaged(input: TableQueryInput!): ActivityPage!
    listActivitiesStats: TableStats!
    getActivity(id: ID!): Activity!
  }

  extend type Mutation {
    createCompany(input: CompanyInput!): Company!
    updateCompany(id: ID!, input: CompanyInput!): Company!
    deleteCompany(id: ID!): Boolean!

    createContact(input: ContactInput!): Contact!
    updateContact(id: ID!, input: ContactInput!): Contact!
    deleteContact(id: ID!): Boolean!

    createDeal(input: DealInput!): Deal!
    updateDeal(id: ID!, input: DealInput!): Deal!
    deleteDeal(id: ID!): Boolean!
    "Moves a deal to another pipeline stage — what a drag on the board does."
    setDealStage(id: ID!, stage: DealStage!): Deal!

    createActivity(input: ActivityInput!): Activity!
    updateActivity(id: ID!, input: ActivityInput!): Activity!
    deleteActivity(id: ID!): Boolean!
  }
`;
