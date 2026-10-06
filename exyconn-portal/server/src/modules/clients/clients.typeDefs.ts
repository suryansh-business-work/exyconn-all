import gql from 'graphql-tag';

export const clientsTypeDefs = gql`
  enum ClientStatus {
    ACTIVE
    INACTIVE
    PROSPECT
  }

  "The kind of business tax number a client is registered under (the same codes as @exyconn/regex TAX_ID_TYPES)."
  enum ClientTaxIdType {
    "India: GSTIN"
    IN_GST
    "European Union: VAT number"
    EU_VAT
    "United Kingdom: VAT number"
    GB_VAT
    "United States: Employer Identification Number"
    US_EIN
    "Canada: Business Number (GST/HST)"
    CA_BN
    "Australia: Australian Business Number"
    AU_ABN
    "New Zealand: GST number"
    NZ_GST
    "United Arab Emirates: Tax Registration Number"
    AE_TRN
    "Saudi Arabia: VAT number"
    SA_VAT
    "Singapore: UEN / GST registration"
    SG_UEN
    "Switzerland and Liechtenstein: UID / VAT number"
    CH_UID
    "Brazil: CNPJ"
    BR_CNPJ
    "Mexico: RFC"
    MX_RFC
    "South Africa: VAT number"
    ZA_VAT
    "Japan: Corporate Number"
    JP_CN
    "Any other country's business tax number"
    OTHER
  }

  type Client {
    id: ID!
    name: String!
    email: String!
    phone: String!
    company: String!
    status: ClientStatus!
    "ISO 3166-1 alpha-2 country the client is established in; empty when not recorded."
    country: String!
    "ISO 4217 currency their invoices default to; empty for the company's own."
    currency: String!
    "The kind of tax number on file; null when there is none."
    taxIdType: ClientTaxIdType
    "Their business tax number, printed on invoices to them."
    taxId: String!
    "What the number is called (GSTIN, VAT number, EIN…), for an invoice or a grid."
    taxIdLabel: String!
    "The GSTIN when the client is Indian (same as taxId then); kept for older callers."
    gstin: String!
    "Two-digit GST state code (Indian clients only) — the default place of supply."
    stateCode: String!
    "State, province or region."
    region: String!
    city: String!
    postalCode: String!
    billingAddress: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ClientInput {
    name: String!
    email: String!
    phone: String!
    company: String!
    status: ClientStatus!
    country: String
    currency: String
    taxIdType: ClientTaxIdType
    taxId: String
    "Deprecated: send taxIdType IN_GST and taxId instead."
    gstin: String
    stateCode: String
    region: String
    city: String
    postalCode: String
    billingAddress: String
  }

  type ClientPage {
    rows: [Client!]!
    totalCount: Int!
  }

  "A project a client can be linked to, with the client it is linked to now."
  type ClientProjectOption {
    id: ID!
    name: String!
    key: String!
    "Empty when the project belongs to no client."
    clientId: String!
    clientName: String!
  }

  extend type Query {
    listClients: [Client!]!
    listClientsPaged(input: TableQueryInput!): ClientPage!
    listClientsStats: TableStats!
    getClient(id: ID!): Client!
    "Every project, for the Clients form's project picker."
    clientProjectOptions: [ClientProjectOption!]!
  }

  extend type Mutation {
    createClient(input: ClientInput!): Client!
    updateClient(id: ID!, input: ClientInput!): Client!
    deleteClient(id: ID!): Boolean!
    "Makes these exactly the projects linked to the client (others are unlinked from it)."
    setClientProjects(clientId: ID!, projectIds: [ID!]!): Boolean!
  }
`;
