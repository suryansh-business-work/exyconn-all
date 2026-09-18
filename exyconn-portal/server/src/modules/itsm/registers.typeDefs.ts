import gql from 'graphql-tag';

/** The IT registers: the network, the cloud estate and the known vulnerabilities. */
export const itRegistersTypeDefs = gql`
  enum ItNetworkKind {
    WIFI
    VPN
    FIREWALL
    DNS
    IP_RANGE
    ROUTER
    SWITCH
    OTHER
  }

  enum ItCloudKind {
    SERVER
    DOCKER_HOST
    KUBERNETES
    DATABASE
    DOMAIN
    SSL_CERTIFICATE
    STORAGE
    OTHER
  }

  enum ItServiceStatus {
    ACTIVE
    DEGRADED
    DOWN
    RETIRED
  }

  enum ItEnvironment {
    PRODUCTION
    STAGING
    DEVELOPMENT
  }

  enum ItVulnSeverity {
    CRITICAL
    HIGH
    MEDIUM
    LOW
  }

  enum ItVulnSource {
    SCAN
    PENTEST
    VENDOR_ADVISORY
    REPORT
  }

  enum ItVulnStatus {
    OPEN
    IN_PROGRESS
    MITIGATED
    RESOLVED
    ACCEPTED
  }

  "One piece of the network: Wi-Fi, VPN, firewall, DNS zone, IP range, router or switch."
  type ItNetworkItem {
    id: ID!
    name: String!
    kind: ItNetworkKind!
    "IP, CIDR range, hostname or SSID."
    address: String!
    location: String!
    provider: String!
    status: ItServiceStatus!
    notes: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ItNetworkItemInput {
    name: String!
    kind: ItNetworkKind!
    address: String
    location: String
    provider: String
    status: ItServiceStatus!
    notes: String
  }

  type ItNetworkItemPage {
    rows: [ItNetworkItem!]!
    totalCount: Int!
  }

  "A server, cluster, database, domain or certificate the company runs or pays for."
  type ItCloudResource {
    id: ID!
    name: String!
    kind: ItCloudKind!
    provider: String!
    environment: ItEnvironment!
    region: String!
    "Hostname, URL or connection target — never a credential."
    endpoint: String!
    "When a domain or certificate lapses."
    expiresAt: DateTime
    monthlyCost: Float!
    status: ItServiceStatus!
    ownerName: String!
    notes: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ItCloudResourceInput {
    name: String!
    kind: ItCloudKind!
    provider: String
    environment: ItEnvironment!
    region: String
    endpoint: String
    expiresAt: DateTime
    monthlyCost: Float!
    status: ItServiceStatus!
    ownerName: String
    notes: String
  }

  type ItCloudResourcePage {
    rows: [ItCloudResource!]!
    totalCount: Int!
  }

  "A known weakness in something the company runs, and what is being done about it."
  type ItVulnerability {
    id: ID!
    title: String!
    cve: String!
    severity: ItVulnSeverity!
    source: ItVulnSource!
    affectedSystem: String!
    status: ItVulnStatus!
    discoveredAt: DateTime!
    dueAt: DateTime
    ownerName: String!
    notes: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ItVulnerabilityInput {
    title: String!
    cve: String
    severity: ItVulnSeverity!
    source: ItVulnSource!
    affectedSystem: String!
    status: ItVulnStatus!
    discoveredAt: DateTime!
    dueAt: DateTime
    ownerName: String
    notes: String
  }

  type ItVulnerabilityPage {
    rows: [ItVulnerability!]!
    totalCount: Int!
  }

  extend type Query {
    listItNetworkItems: [ItNetworkItem!]!
    listItNetworkItemsPaged(input: TableQueryInput!): ItNetworkItemPage!
    listItNetworkItemsStats: TableStats!
    getItNetworkItem(id: ID!): ItNetworkItem!
    listItCloudResources: [ItCloudResource!]!
    listItCloudResourcesPaged(input: TableQueryInput!): ItCloudResourcePage!
    listItCloudResourcesStats: TableStats!
    getItCloudResource(id: ID!): ItCloudResource!
    listItVulnerabilities: [ItVulnerability!]!
    listItVulnerabilitiesPaged(input: TableQueryInput!): ItVulnerabilityPage!
    listItVulnerabilitiesStats: TableStats!
    getItVulnerability(id: ID!): ItVulnerability!
  }

  extend type Mutation {
    createItNetworkItem(input: ItNetworkItemInput!): ItNetworkItem!
    updateItNetworkItem(id: ID!, input: ItNetworkItemInput!): ItNetworkItem!
    deleteItNetworkItem(id: ID!): Boolean!
    createItCloudResource(input: ItCloudResourceInput!): ItCloudResource!
    updateItCloudResource(id: ID!, input: ItCloudResourceInput!): ItCloudResource!
    deleteItCloudResource(id: ID!): Boolean!
    createItVulnerability(input: ItVulnerabilityInput!): ItVulnerability!
    updateItVulnerability(id: ID!, input: ItVulnerabilityInput!): ItVulnerability!
    deleteItVulnerability(id: ID!): Boolean!
  }
`;
