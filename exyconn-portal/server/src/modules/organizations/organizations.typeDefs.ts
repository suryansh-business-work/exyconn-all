import gql from 'graphql-tag';

export const organizationsTypeDefs = gql`
  enum OrganizationStatus {
    ACTIVE
    SUSPENDED
  }

  "Whose tax rules a company's invoices and payroll follow."
  enum TaxSystem {
    "No tax lines at all."
    NONE
    "One tax line at the company's own rate."
    VAT
    "India: GSTIN and place of supply, CGST/SGST/IGST, PF/ESI/professional tax, income-tax slabs."
    INDIA_GST
  }

  "One company using the portal. Every other record belongs to exactly one of these."
  type Organization {
    id: ID!
    name: String!
    "URL-safe handle, unique across the platform."
    slug: String!
    legalName: String!
    status: OrganizationStatus!
    "ISO 3166-1 alpha-2 country code, or empty when not stated."
    country: String!
    "ISO 4217 currency code — the money this company keeps its books in."
    currency: String!
    "BCP 47 language tag the company reads by default."
    locale: String!
    "IANA timezone the company works by."
    timezone: String!
    "The month its financial year opens: 1 is January, 4 is April."
    fiscalYearStartMonth: Int!
    taxSystem: TaxSystem!
    contactEmail: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input OrganizationInput {
    name: String!
    slug: String
    legalName: String
    country: String
    currency: String!
    locale: String
    timezone: String
    fiscalYearStartMonth: Int
    taxSystem: TaxSystem
    contactEmail: String
  }

  input OrganizationUpdateInput {
    name: String
    legalName: String
    country: String
    currency: String
    locale: String
    timezone: String
    fiscalYearStartMonth: Int
    taxSystem: TaxSystem
    contactEmail: String
  }

  "The person a company is handed over to — its first administrator."
  input OrganizationAdminInput {
    name: String!
    email: String!
  }

  extend type User {
    "The company this person belongs to; null for a platform administrator."
    organizationId: ID
  }

  extend type Query {
    "Every organization on the platform (SUPER_ADMIN)."
    organizations: [Organization!]!
    "One organization (SUPER_ADMIN)."
    organization(id: ID!): Organization!
    "The signed-in person's own company, or null for a platform administrator."
    myOrganization: Organization
  }

  extend type Mutation {
    "Creates a company and provisions its defaults (SUPER_ADMIN)."
    createOrganization(input: OrganizationInput!): Organization!
    updateOrganization(id: ID!, input: OrganizationUpdateInput!): Organization!
    "Suspending keeps every record and stops every sign-in in that company."
    setOrganizationStatus(id: ID!, status: OrganizationStatus!): Organization!
    "Creates or promotes the company's administrator, who then administers it (SUPER_ADMIN)."
    assignOrganizationAdmin(organizationId: ID!, input: OrganizationAdminInput!): User!
  }
`;
