import gql from 'graphql-tag';

/** The MCP portal (mcp.exyconn.com): its servers, their tools, usage, activity and connections. */
export const mcpTypeDefs = gql`
  enum McpToolKind {
    QUERY
    MUTATION
  }

  "An MCP server: one module's (CRM, MARKETING, HR and the rest), or ALL, which combines every module's tools."
  enum McpEndpoint {
    CRM
    MARKETING
    ADMIN
    AI
    CLIENTHUB
    COMPLIANCE
    EMPLOYEE
    FINANCE
    HR
    IT
    LEGAL
    PRODUCTS
    PROJECTS
    SOCIAL
    STATUS
    SUPPORT
    TECH
    TRACKER
    WEBSITE
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
    "False when the company's MCP settings switch the tool off, or its server only reads and it changes something."
    enabled: Boolean!
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
    "The time 95 in 100 calls of the tool finish within."
    p95Ms: Float!
    lastAt: DateTime!
  }

  type McpPersonUsage {
    userName: String!
    calls: Int!
  }

  "Calls by the MCP client that made them, e.g. Claude or Claude Code."
  type McpClientUsage {
    clientName: String!
    calls: Int!
  }

  "Calls by the module server their tool belongs to."
  type McpModuleUsage {
    server: McpEndpoint!
    calls: Int!
  }

  "Failed calls of one kind: FORBIDDEN, NOT_FOUND, BAD_USER_INPUT, INVALID_ARGUMENTS, INTERNAL and the rest."
  type McpErrorCodeCount {
    code: String!
    count: Int!
  }

  "The company's MCP calls over a window."
  type McpUsage {
    calls: Int!
    failures: Int!
    "Calls that changed something (mutations); the rest only read."
    writes: Int!
    people: Int!
    "The median call time."
    p50Ms: Float!
    "The time 95 in 100 calls finish within."
    p95Ms: Float!
    days: [McpUsageDay!]!
    tools: [McpToolUsage!]!
    users: [McpPersonUsage!]!
    clients: [McpClientUsage!]!
    servers: [McpModuleUsage!]!
    errorCodes: [McpErrorCodeCount!]!
  }

  "Failed calls grouped by tool, error code and message, for a server's error log."
  type McpErrorGroup {
    server: McpEndpoint!
    tool: String!
    errorCode: String!
    error: String!
    count: Int!
    "How many people the failure hit."
    people: Int!
    firstAt: DateTime!
    lastAt: DateTime!
    "The trace id of the latest call that failed this way; find it in the activity log."
    lastTraceId: String!
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
    "The failure's kind (FORBIDDEN, BAD_USER_INPUT, INTERNAL…); empty when the call worked."
    errorCode: String!
    durationMs: Int!
    "Handed to Claude with the answer, so a call can be found from what the person saw."
    traceId: String!
    "The endpoint the call came through; null for calls made before it was kept."
    endpoint: McpEndpoint
    "The arguments given, by name only."
    argNames: [String!]!
    "How long the answer handed to Claude was, in characters."
    answerChars: Int!
    "Whether rows were left out of the answer to fit."
    truncated: Boolean!
  }

  "A connected Claude (or other MCP client) acting for one person in this company."
  type McpConnection {
    id: ID!
    "The server the connection is good for."
    endpoint: McpEndpoint!
    clientName: String!
    userName: String!
    "Allowed for reading only: Claude is never offered a change through it."
    readOnly: Boolean!
    createdAt: DateTime!
    lastUsedAt: DateTime
  }

  "The company's MCP settings: rate limits, switched-off tools, read-only servers and alerts. 0 in a limit means no limit."
  type McpSettings {
    callsPerHourPerPerson: Int!
    callsPerHourPerConnection: Int!
    writesPerHourPerPerson: Int!
    "Tools nobody in the company can call through MCP, by name."
    disabledTools: [String!]!
    "Module servers that only read: their changes are not offered."
    readOnlyServers: [McpEndpoint!]!
    alertsEnabled: Boolean!
    alertErrorRatePercent: Int!
    alertP95Ms: Int!
    alertMinCalls: Int!
    "The Slack channel id alerts and the digest go to; empty sends them to admins' notifications only."
    alertSlackChannel: String!
    dailyDigest: Boolean!
    lastAlertAt: DateTime
  }

  "What an admin changes on the MCP Settings page; fields left out keep their value."
  input McpSettingsInput {
    "Calls a person may make an hour across every connection, 0 to 100000; 0 is no limit."
    callsPerHourPerPerson: Int
    "Calls one connection (one Claude client for one person) may make an hour; 0 is no limit."
    callsPerHourPerConnection: Int
    "Changes a person may make an hour; 0 is no limit."
    writesPerHourPerPerson: Int
    disabledTools: [String!]
    readOnlyServers: [McpEndpoint!]
    alertsEnabled: Boolean
    "Alert when this share of the last hour's calls failed, 1 to 100."
    alertErrorRatePercent: Int
    "Alert when the last hour's p95 call time is over this, 100 to 600000 ms."
    alertP95Ms: Int
    "No alert below this many calls in the hour."
    alertMinCalls: Int
    alertSlackChannel: String
    dailyDigest: Boolean
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
    mcpActivity(
      endpoint: McpEndpoint!
      days: Int!
      limit: Int
      "True lists only calls that worked, false only failures; leave out for both."
      ok: Boolean
      "A trace id (exact), or part of a tool or person name."
      search: String
    ): [McpCall!]!
    "Failed calls to a server over the last days, 1 to 180, grouped by tool, code and message, most frequent first."
    mcpErrors(endpoint: McpEndpoint!, days: Int!): [McpErrorGroup!]!
    "Live connections to a server in this company; ALL lists every connection the caller may see."
    mcpConnections(endpoint: McpEndpoint!): [McpConnection!]!
    "ADMIN: the company's MCP settings."
    mcpSettings: McpSettings!
    "ADMIN: the Slack channels MCP alerts can go to."
    mcpSlackChannels: [SlackChannel!]!
    "The sign-in a connector is waiting on, for the consent page (the server's role)."
    mcpAuthorizationRequest(id: ID!): McpAuthorizationRequest!
  }

  extend type Mutation {
    "Allows the sign-in; answers the address to send the browser back to."
    approveMcpAuthorization(
      id: ID!
      "True connects Claude for reading only: it is never offered a change."
      readOnly: Boolean
    ): String!
    "Declines the sign-in; answers the address to send the browser back to."
    denyMcpAuthorization(id: ID!): String!
    "ADMIN: saves the company's MCP settings; they apply to the next call. Audited."
    updateMcpSettings(input: McpSettingsInput!): McpSettings!
    "Signs one connection out; Claude has to connect again."
    revokeMcpConnection(id: ID!): Boolean!
  }
`;
