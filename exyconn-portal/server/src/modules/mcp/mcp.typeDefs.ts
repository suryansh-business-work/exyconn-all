import gql from 'graphql-tag';

/** The MCP portal (mcp.exyconn.com): its servers, their tools, usage, activity and connections. */
export const mcpTypeDefs = gql`
  enum McpToolKind {
    QUERY
    MUTATION
  }

  "An MCP server: one module's (CRM, MARKETING), or ALL, which combines every module's tools."
  enum McpEndpoint {
    CRM
    MARKETING
    ALL
  }

  type McpToolArgument {
    name: String!
    "The GraphQL type, e.g. String! or [ID!]."
    type: String!
    required: Boolean!
    description: String!
  }

  "One module operation Claude can call."
  type McpTool {
    "The module server the tool belongs to."
    server: McpEndpoint!
    name: String!
    kind: McpToolKind!
    description: String!
    arguments: [McpToolArgument!]!
  }

  "One MCP server the person may use, and what they need to connect Claude to it."
  type McpServer {
    endpoint: McpEndpoint!
    "The server as people say it, e.g. CRM."
    label: String!
    "What the server offers, as it tells Claude."
    description: String!
    "The address to paste into Claude as a custom connector."
    serverUrl: String!
    toolCount: Int!
    queryCount: Int!
    mutationCount: Int!
    "Live connections to this server in the company."
    connectionCount: Int!
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

  "One tool call made through MCP, for a server's activity log."
  type McpCall {
    id: ID!
    "The module server the tool belongs to."
    server: McpEndpoint!
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
    "The server the connection is good for."
    endpoint: McpEndpoint!
    clientName: String!
    userName: String!
    createdAt: DateTime!
    lastUsedAt: DateTime
  }

  "A sign-in waiting for the person to allow it."
  type McpAuthorizationRequest {
    id: ID!
    endpoint: McpEndpoint!
    "The server as people say it, e.g. CRM or All Exyconn tools."
    serverLabel: String!
    clientName: String!
    "Where the client gets the answer, e.g. claude.ai."
    redirectHost: String!
    scopes: [String!]!
  }

  extend type Query {
    "Every MCP server the caller may use (its module's role), the global ALL server last."
    mcpServers: [McpServer!]!
    "Every tool of a server, with its arguments (the server's role)."
    mcpTools(endpoint: McpEndpoint!): [McpTool!]!
    "This company's calls to a server over the last days, 1 to 180; ALL covers every server the caller may use."
    mcpUsage(endpoint: McpEndpoint!, days: Int!): McpUsage!
    "The newest calls to a server in this company, for its activity log; ALL covers every server the caller may use."
    mcpActivity(endpoint: McpEndpoint!, days: Int!, limit: Int): [McpCall!]!
    "Live connections to a server in this company; ALL lists every connection the caller may see."
    mcpConnections(endpoint: McpEndpoint!): [McpConnection!]!
    "The sign-in a connector is waiting on, for the consent page (the server's role)."
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
