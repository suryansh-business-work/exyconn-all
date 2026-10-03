import gql from 'graphql-tag';

/**
 * Tech › Security: the TLS certificates of every monitored host, read live off a handshake,
 * and the code-quality picture the configured SonarQube project reports. Nothing measured
 * here is stored; only the SonarQube credential is.
 */
export const securityTypeDefs = gql`
  enum SslCertificateStatus {
    OK
    EXPIRING
    EXPIRED
    INVALID
    UNREACHABLE
  }

  "The certificate one monitored host presented, and what it means."
  type SslCertificate {
    host: String!
    "Names of the status monitors whose https URL points at this host."
    monitors: [String!]!
    status: SslCertificateStatus!
    "The subject common name."
    subject: String!
    "Every name the certificate is valid for."
    altNames: [String!]!
    issuer: String!
    validFrom: DateTime
    validTo: DateTime
    "Whole days until it expires, negative once it has. Null when unknown."
    daysLeft: Int
    serialNumber: String!
    fingerprint256: String!
    "The negotiated TLS version, e.g. TLSv1.3."
    protocol: String!
    "Whether the chain verified against the trusted roots for this host name."
    authorized: Boolean!
    "Why the chain did not verify, or why the host could not be reached. Empty when fine."
    error: String!
    checkedAt: DateTime!
  }

  type SslCertificateReport {
    "A certificate with this many days or fewer left is EXPIRING."
    warningDays: Int!
    checkedAt: DateTime!
    certificates: [SslCertificate!]!
  }

  "A SonarQube or SonarCloud project the Security screen reads."
  type SonarConfig {
    id: ID!
    label: String!
    hostUrl: String!
    projectKey: String!
    "SonarCloud organization key; empty for a self-hosted SonarQube."
    organization: String!
    "Whether a token is stored. The token itself is write-only and never returned."
    hasToken: Boolean!
    "The token's last four characters, to tell two apart; null when too short to show safely."
    tokenHint: String
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input SonarConfigInput {
    label: String!
    hostUrl: String!
    "Write-only. Leave empty when editing to keep the stored token."
    token: String!
    projectKey: String!
    organization: String
    isActive: Boolean
  }

  "What a connection test found, in words for the person who pressed it."
  type SonarConnectionTest {
    ok: Boolean!
    message: String!
  }

  enum SonarOverviewState {
    OK
    NOT_CONFIGURED
    UNAUTHORIZED
    NOT_FOUND
    UNREACHABLE
    ERROR
  }

  type SonarGateCondition {
    status: String!
    metric: String!
    comparator: String!
    errorThreshold: String!
    actualValue: String!
  }

  type SonarQualityGate {
    "OK, WARN, ERROR or NONE when the project has no gate."
    status: String!
    conditions: [SonarGateCondition!]!
  }

  "The project's measures. Ratings are letters A to E; anything not computed is null."
  type SonarMetrics {
    alertStatus: String
    bugs: Float
    vulnerabilities: Float
    securityHotspots: Float
    codeSmells: Float
    coverage: Float
    duplicatedLinesDensity: Float
    ncloc: Float
    reliabilityRating: String
    securityRating: String
    maintainabilityRating: String
    technicalDebtMinutes: Float
    newBugs: Float
    newVulnerabilities: Float
    newSecurityHotspots: Float
    newCodeSmells: Float
    newCoverage: Float
    newDuplicatedLinesDensity: Float
  }

  type SonarAnalysis {
    key: String!
    date: DateTime!
    version: String!
    events: [String!]!
  }

  type SonarIssue {
    key: String!
    rule: String!
    severity: String!
    type: String!
    file: String!
    line: Int
    message: String!
    "Opens the issue in SonarQube."
    url: String!
  }

  type SonarFacetCount {
    value: String!
    count: Int!
  }

  "The active SonarQube project at a glance. A problem is a state with a message, not an error."
  type SonarOverview {
    state: SonarOverviewState!
    message: String!
    configLabel: String!
    projectKey: String!
    projectUrl: String!
    checkedAt: DateTime!
    qualityGate: SonarQualityGate
    metrics: SonarMetrics
    analyses: [SonarAnalysis!]!
    "The most severe open issues, worst first."
    issues: [SonarIssue!]!
    issuesTotal: Int!
    severityCounts: [SonarFacetCount!]!
    typeCounts: [SonarFacetCount!]!
  }

  extend type Query {
    "TECH: every monitored host's certificate. Cached for ten minutes unless refresh is set."
    sslCertificates(refresh: Boolean): SslCertificateReport!
    listSonarConfigs: [SonarConfig!]!
    "TECH: the active SonarQube project. Cached for five minutes unless refresh is set."
    sonarOverview(refresh: Boolean): SonarOverview!
    "TECH: the worst open issues of one severity (BLOCKER, CRITICAL, MAJOR, MINOR, INFO)."
    sonarIssues(severity: String!): [SonarIssue!]!
  }

  extend type Mutation {
    createSonarConfig(input: SonarConfigInput!): SonarConfig!
    updateSonarConfig(id: ID!, input: SonarConfigInput!): SonarConfig!
    deleteSonarConfig(id: ID!): Boolean!
    "Validates the token, then checks it can see the project."
    testSonarConnection(id: ID!): SonarConnectionTest!
  }
`;
