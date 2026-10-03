import gql from 'graphql-tag';

/**
 * Tech > Security > Cloudflare: the GoDaddy and Cloudflare credentials, a domain's DNS on both
 * providers side by side, moving the records to Cloudflare and switching the nameservers.
 */
export const dnsTypeDefs = gql`
  "The GoDaddy API credential. The key and secret are write-only and never returned."
  type GodaddyConfig {
    id: ID!
    label: String!
    hasApiKey: Boolean!
    apiKeyHint: String
    hasApiSecret: Boolean!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input GodaddyConfigInput {
    label: String!
    "Write-only. Leave empty when editing to keep the stored key."
    apiKey: String
    "Write-only. Leave empty when editing to keep the stored secret."
    apiSecret: String
    isActive: Boolean
  }

  "The Cloudflare API credential. The token is write-only and never returned."
  type CloudflareConfig {
    id: ID!
    label: String!
    "The Cloudflare account a domain's zone is created in."
    accountId: String!
    hasApiToken: Boolean!
    apiTokenHint: String
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CloudflareConfigInput {
    label: String!
    "Write-only. Leave empty when editing to keep the stored token."
    apiToken: String
    accountId: String!
    isActive: Boolean
  }

  "A domain on the GoDaddy account."
  type DnsDomain {
    domain: String!
    status: String!
    nameServers: [String!]!
  }

  "Who answers for a domain now, judged from the nameservers the registry holds."
  enum DnsAuthority {
    GODADDY
    CLOUDFLARE
    OTHER
  }

  enum DnsRecordStatus {
    MATCH
    MISSING_ON_CLOUDFLARE
    ONLY_ON_CLOUDFLARE
  }

  "One DNS record and where it exists. TTL and proxying are shown but never make a mismatch."
  type DnsRecordPair {
    key: String!
    type: String!
    name: String!
    content: String!
    priority: Int
    godaddyTtl: Int
    cloudflareTtl: Int
    cloudflareProxied: Boolean
    status: DnsRecordStatus!
  }

  "A domain's Cloudflare zone and the nameservers Cloudflare assigned it."
  type CloudflareZone {
    id: ID!
    status: String!
    nameServers: [String!]!
    originalNameServers: [String!]!
  }

  type DnsOverview {
    domain: String!
    authority: DnsAuthority!
    "The nameservers GoDaddy's registry holds for the domain now."
    godaddyNameServers: [String!]!
    "The GoDaddy nameservers the domain had before the portal first moved it; empty if never."
    previousGodaddyNameServers: [String!]!
    "Null until the domain is shifted to Cloudflare."
    zone: CloudflareZone
    records: [DnsRecordPair!]!
    missingOnCloudflare: Int!
  }

  type DnsMigrationFailure {
    type: String!
    name: String!
    content: String!
    message: String!
  }

  type DnsMigrationResult {
    created: Int!
    alreadyPresent: Int!
    failed: [DnsMigrationFailure!]!
    zone: CloudflareZone!
  }

  enum NameserverTarget {
    CLOUDFLARE
    GODADDY
    CUSTOM
  }

  extend type Query {
    listGodaddyConfigs: [GodaddyConfig!]!
    listCloudflareConfigs: [CloudflareConfig!]!
    "The domains on the active GoDaddy account."
    dnsDomains: [DnsDomain!]!
    "A domain's records on GoDaddy and Cloudflare side by side, and its nameservers."
    dnsOverview(domain: String!): DnsOverview!
  }

  extend type Mutation {
    createGodaddyConfig(input: GodaddyConfigInput!): GodaddyConfig!
    updateGodaddyConfig(id: ID!, input: GodaddyConfigInput!): GodaddyConfig!
    deleteGodaddyConfig(id: ID!): Boolean!
    testGodaddyConnection(id: ID!): Boolean!
    createCloudflareConfig(input: CloudflareConfigInput!): CloudflareConfig!
    updateCloudflareConfig(id: ID!, input: CloudflareConfigInput!): CloudflareConfig!
    deleteCloudflareConfig(id: ID!): Boolean!
    testCloudflareConnection(id: ID!): Boolean!
    "Copies every GoDaddy record Cloudflare lacks into the domain's zone, creating the zone first."
    migrateDnsToCloudflare(domain: String!): DnsMigrationResult!
    "Points the domain's nameservers at Cloudflare, back at GoDaddy, or at a custom set."
    setDomainNameservers(
      domain: String!
      target: NameserverTarget!
      nameServers: [String!]
    ): [String!]!
  }
`;
