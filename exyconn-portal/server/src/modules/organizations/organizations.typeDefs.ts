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
    "Its logo (an https URL), or empty when none was uploaded."
    logoUrl: String!
    "Its website, or empty."
    website: String!
    phone: String!
    industry: String!
    "A headcount band such as 11-50, or empty."
    companySize: String!
    "Company registration number (CIN, Companies House number, EIN...), or empty."
    registrationNumber: String!
    "Tax registration (GSTIN, VAT number...), or empty."
    taxId: String!
    addressLine1: String!
    addressLine2: String!
    city: String!
    region: String!
    postalCode: String!
    "A short note about the company, or empty."
    description: String!
    "Whether this is the company that operates the platform itself. Read-only; set at boot."
    isPlatformOperator: Boolean!
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
    logoUrl: String
    website: String
    phone: String
    industry: String
    companySize: String
    registrationNumber: String
    taxId: String
    addressLine1: String
    addressLine2: String
    city: String
    region: String
    postalCode: String
    description: String
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
    logoUrl: String
    website: String
    phone: String
    industry: String
    companySize: String
    registrationNumber: String
    taxId: String
    addressLine1: String
    addressLine2: String
    city: String
    region: String
    postalCode: String
    description: String
  }

  "Somebody invited into a company, with the portals (roles) they may open."
  input OrganizationMemberInput {
    name: String!
    email: String!
    "One role per portal they may open. SUPER_ADMIN is never granted this way."
    roles: [Role!]!
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
    "Everything done to one organization, newest first: created, edited, suspended, people invited (SUPER_ADMIN)."
    organizationHistory(id: ID!): [AuditLog!]!
    "The company this request works in: the person's own, or for a SUPER_ADMIN the one the portal's address names. Null for a platform administrator with no company."
    myOrganization: Organization
  }

  extend type Mutation {
    "Creates a company and provisions its defaults (SUPER_ADMIN)."
    createOrganization(input: OrganizationInput!): Organization!
    updateOrganization(id: ID!, input: OrganizationUpdateInput!): Organization!
    "Suspending keeps every record and stops every sign-in in that company."
    setOrganizationStatus(id: ID!, status: OrganizationStatus!): Organization!
    """
    Invites people into a company with the portals they may open; each gets the welcome email
    with a temporary password. Somebody already in that company gains the roles (SUPER_ADMIN).
    """
    inviteOrganizationMembers(organizationId: ID!, members: [OrganizationMemberInput!]!): [User!]!
    "Creates or promotes the company's administrator, who then administers it (SUPER_ADMIN)."
    assignOrganizationAdmin(organizationId: ID!, input: OrganizationAdminInput!): User!
  }
`;
