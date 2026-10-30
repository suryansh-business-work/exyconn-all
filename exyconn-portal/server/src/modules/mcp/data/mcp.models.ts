import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { MCP_ENDPOINTS, MCP_SERVERS } from '../servers';

/** How long a sign-in in progress, and its one-time code, are worth. */
const REQUEST_TTL_SECONDS = 10 * 60;
/** How long a tool call is kept for the activity log and the usage dashboards. */
const CALL_TTL_SECONDS = 180 * 24 * 60 * 60;

/**
 * A client that registered itself (OAuth dynamic client registration) — Claude, once per
 * connector. Install-wide: a client is an app, not a company's data.
 */
const mcpClientSchema = new Schema(
  {
    clientId: { type: String, required: true, unique: true },
    /** Sealed; absent for a public client (PKCE only), which is what Claude registers as. */
    clientSecret: { type: String, default: '' },
    clientName: { type: String, default: '', trim: true, maxlength: 200 },
    redirectUris: { type: [String], required: true },
    /** Everything else the client registered with, kept as sent (RFC 7591). */
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

/** Where a connection points: one module's server, or the global one (`all`). */
const endpointField = { type: String, enum: MCP_ENDPOINTS, required: true };

/** A sign-in waiting for the person to allow it on the MCP portal's consent page. */
const mcpAuthRequestSchema = new Schema({
  clientId: { type: String, required: true },
  endpoint: endpointField,
  redirectUri: { type: String, required: true },
  codeChallenge: { type: String, required: true },
  state: { type: String, default: '' },
  scopes: { type: [String], default: [] },
  resource: { type: String, default: '' },
  expiresAt: { type: Date, required: true, expires: 0 },
});

/** A one-time code for an allowed sign-in, traded once at the token endpoint. */
const mcpAuthCodeSchema = new Schema({
  codeHash: { type: String, required: true, unique: true },
  clientId: { type: String, required: true },
  endpoint: endpointField,
  userId: { type: String, required: true },
  organizationId: { type: String, required: true },
  redirectUri: { type: String, required: true },
  codeChallenge: { type: String, required: true },
  scopes: { type: [String], default: [] },
  usedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true, expires: REQUEST_TTL_SECONDS },
});

/**
 * One connection: the tokens a client holds for one person in one company, good at one endpoint
 * only. Only hashes are stored. The refresh token rotates on every use; a revoked row signs that
 * connector out.
 */
const mcpTokenSchema = new Schema(
  {
    clientId: { type: String, required: true },
    endpoint: { ...endpointField, index: true },
    clientName: { type: String, default: '' },
    userId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    accessHash: { type: String, required: true, unique: true },
    refreshHash: { type: String, required: true, unique: true },
    scopes: { type: [String], default: [] },
    accessExpiresAt: { type: Date, required: true },
    refreshExpiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

/**
 * One tool call made through MCP, in the caller's company: what ran, for whom, and how it went.
 * The MCP portal's activity logs and usage dashboards read these. Arguments are not kept (they
 * can carry personal data); the summary names the records only by what the tool returns.
 */
const mcpCallSchema = new Schema({
  /** The module server the tool belongs to, whichever endpoint it was called through. */
  server: { type: String, enum: MCP_SERVERS.map((spec) => spec.key), required: true },
  userId: { type: String, required: true },
  userName: { type: String, default: '' },
  clientName: { type: String, default: '' },
  tool: { type: String, required: true },
  kind: { type: String, enum: ['QUERY', 'MUTATION'], required: true },
  ok: { type: Boolean, required: true },
  error: { type: String, default: '' },
  /** The failure's kind: the GraphQL error code (FORBIDDEN, BAD_USER_INPUT…), or INTERNAL. */
  errorCode: { type: String, default: '' },
  durationMs: { type: Number, default: 0 },
  /** Handed back to Claude with the answer, so one call can be found from what the person saw. */
  traceId: { type: String, default: '' },
  /** The endpoint the call came through: the module's own, or `all`. */
  endpoint: { type: String, enum: [...MCP_ENDPOINTS, ''], default: '' },
  /** The arguments given, by name only: their values can carry personal data. */
  argNames: { type: [String], default: [] },
  /** How long the answer handed to Claude was, in characters, and whether it was cut. */
  answerChars: { type: Number, default: 0 },
  truncated: { type: Boolean, default: false },
  at: { type: Date, required: true, default: Date.now, expires: CALL_TTL_SECONDS },
});
mcpCallSchema.index({ server: 1, at: -1 });
mcpCallSchema.index({ at: -1 });
mcpCallSchema.index({ traceId: 1 });

export type McpClientDocument = InferSchemaType<typeof mcpClientSchema>;
export type McpAuthRequestDocument = InferSchemaType<typeof mcpAuthRequestSchema>;
export type McpAuthCodeDocument = InferSchemaType<typeof mcpAuthCodeSchema>;
export type McpTokenDocument = InferSchemaType<typeof mcpTokenSchema>;
export type McpCallDocument = InferSchemaType<typeof mcpCallSchema>;

export const McpClientModel: Model<McpClientDocument> = model<McpClientDocument>(
  'McpClient',
  mcpClientSchema,
);
export const McpAuthRequestModel: Model<McpAuthRequestDocument> = model<McpAuthRequestDocument>(
  'McpAuthRequest',
  mcpAuthRequestSchema,
);
export const McpAuthCodeModel: Model<McpAuthCodeDocument> = model<McpAuthCodeDocument>(
  'McpAuthCode',
  mcpAuthCodeSchema,
);
export const McpTokenModel: Model<McpTokenDocument> = model<McpTokenDocument>(
  'McpToken',
  mcpTokenSchema,
);
export const McpCallModel: Model<McpCallDocument> = model<McpCallDocument>(
  'McpCall',
  mcpCallSchema,
);
