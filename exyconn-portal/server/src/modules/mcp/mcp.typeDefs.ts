import gql from 'graphql-tag';

/** AI > MCP Servers, the connector's consent page, and the CRM's MCP activity log. */
export const mcpTypeDefs = gql`
  enum McpToolKind {
    QUERY
    MUTATION
  }

  type McpToolArgument {
    name: String!
    "The GraphQL type, e.g. String! or [ID!]."
    type: String!
    required: Boolean!
    description: String!
  }

  "One CRM operation Claude can call."
  type McpTool {
    name: String!
    kind: McpToolKind!
    description: String!
    arguments: [McpToolArgument!]!
  }

  "What a person needs to connect Claude to the CRM."
  type McpOverview {
    "The address to paste into Claude as a custom connector."
    serverUrl: String!
    toolCount: Int!
    queryCount: Int!
    mutationCount: Int!
  }

  type McpUsageDay {
    day: String!
    calls: Int!
    failures: Int!
  }

  type McpToolUsage {
    tool: String!
    calls: Int!
    failures: Int!
    averageMs: Float!
  }

  type McpPersonUsage {
    userName: String!
    calls: Int!
  }

  "The company's MCP calls over a window."
  type McpUsage {
    calls: Int!
    failures: Int!
    people: Int!
    days: [McpUsageDay!]!
    tools: [McpToolUsage!]!
    users: [McpPersonUsage!]!
  }

  "One tool call made through MCP, for the CRM's activity log."
  type McpCall {
    id: ID!
    at: DateTime!
    userName: String!
    clientName: String!
    tool: String!
    kind: McpToolKind!
    ok: Boolean!
    error: String!
    durationMs: Int!
  }

  "A connected Claude (or other MCP client) acting for one person in this company."
  type McpConnection {
    id: ID!
    clientName: String!
    userName: String!
    createdAt: DateTime!
    lastUsedAt: DateTime
  }

  "A sign-in waiting for the person to allow it."
  type McpAuthorizationRequest {
    id: ID!
    clientName: String!
    "Where the client gets the answer, e.g. claude.ai."
    redirectHost: String!
    scopes: [String!]!
  }

  extend type Query {
    "The connector address and how many CRM tools it offers (CRM role)."
    mcpOverview: McpOverview!
    "Every CRM tool, with its arguments (CRM role)."
    mcpTools: [McpTool!]!
    "This company's MCP calls over the last days, 1 to 180 (CRM role)."
    mcpUsage(days: Int!): McpUsage!
    "The newest MCP calls in this company, for the CRM activity log (CRM role)."
    mcpActivity(days: Int!, limit: Int): [McpCall!]!
    "Every live connection in this company (CRM role)."
    mcpConnections: [McpConnection!]!
    "The sign-in a connector is waiting on, for the consent page (CRM role)."
    mcpAuthorizationRequest(id: ID!): McpAuthorizationRequest!
  }

  extend type Mutation {
    "Allows the sign-in; answers the address to send the browser back to."
    approveMcpAuthorization(id: ID!): String!
    "Declines the sign-in; answers the address to send the browser back to."
    denyMcpAuthorization(id: ID!): String!
    "Signs one connection out; Claude has to connect again."
    revokeMcpConnection(id: ID!): Boolean!
  }
`;
