import type { DocumentNode } from 'graphql';
import type { Role } from '../../../constants/roles';

/** A module offered to Claude as its own MCP server. */
export type McpServerKey =
  | 'crm'
  | 'marketing'
  | 'admin'
  | 'ai'
  | 'clienthub'
  | 'compliance'
  | 'employee'
  | 'finance'
  | 'hr'
  | 'it'
  | 'legal'
  | 'products'
  | 'projects'
  | 'social'
  | 'status'
  | 'support'
  | 'tech'
  | 'tracker'
  | 'website'
  | 'agents';
/** Where a connection points: one module's server, or the global one that combines them all. */
export type McpEndpointKey = McpServerKey | 'all';

/** One module's MCP server: who may use it, and the typeDefs its tools are made from. */
export interface McpServerSpec {
  key: McpServerKey;
  /** The MCP serverInfo name Claude shows, e.g. `exyconn-crm`. */
  name: string;
  /** The module as people say it, e.g. "CRM". */
  label: string;
  /** The role a person needs to connect it and use its tools; ADMIN passes as everywhere. */
  role: Role;
  /** The audit module its connections and the changes made through it are filed under. */
  auditModule: string;
  /** What the server tells Claude about itself. */
  instructions: string;
  /** Every typeDefs file of the module: each Query and Mutation field in them is a tool. */
  typeDefs: readonly DocumentNode[];
}
