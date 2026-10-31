import gql from 'graphql-tag';

/** The MCP sandbox on demos.exyconn.com/mcp-sandbox-demo. */
export const mcpSandboxTypeDefs = gql`
  "How many sample records of one kind the sandbox company holds."
  type McpSandboxSample {
    label: String!
    count: Int!
  }

  "What the MCP sandbox offers before a token is taken."
  type McpSandboxInfo {
    "The sample company the sandbox reads."
    organizationName: String!
    "The MCP server name Claude shows."
    serverName: String!
    "The MCP address the token is good at (every module, /mcp/all)."
    endpointUrl: String!
    tokenTtlMinutes: Int!
    tokensPerDay: Int!
    tokensLeftToday: Int!
    "Tool calls one token may make an hour."
    callsPerHour: Int!
    "The modules whose read-only tools the token reaches."
    modules: [String!]!
    sample: [McpSandboxSample!]!
  }

  "A read-only sandbox MCP token, without its secret."
  type McpSandboxToken {
    id: ID!
    expiresAt: DateTime!
    createdAt: DateTime!
    revokedAt: DateTime
    lastUsedAt: DateTime
    "Neither revoked nor expired."
    active: Boolean!
  }

  "A new sandbox token: the secret is shown this once."
  type McpSandboxIssued {
    token: String!
    sandboxToken: McpSandboxToken!
  }

  extend type Query {
    "Public demo (demo visitor pass or employee): the sandbox's MCP address, token window, limits, modules and sample records."
    mcpSandboxInfo: McpSandboxInfo!
    "Public demo: the caller's own sandbox tokens, newest first."
    mcpSandboxTokens: [McpSandboxToken!]!
  }

  extend type Mutation {
    "Public demo: a short-lived, read-only MCP token for the sandbox company at /mcp/all. Revokes the caller's earlier ones; limited per day; audited."
    issueMcpSandboxToken: McpSandboxIssued!
    "Public demo: revokes one of the caller's own sandbox tokens at once; audited."
    revokeMcpSandboxToken("The token's id." id: ID!): McpSandboxToken!
  }
`;
