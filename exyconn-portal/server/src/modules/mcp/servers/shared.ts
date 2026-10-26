import { searchTypeDefs } from '../../search/search.typeDefs';
import { tableTransferTypeDefs } from '../../table-transfer/tableTransfer.typeDefs';

/**
 * Operations every portal offers, so every module server carries them: global search, and the
 * shared table tools (export, import, bulk delete, archive and restore). Each one runs with the
 * caller's own roles through the module's own operations; `/mcp/all` lists each tool once.
 *
 * Deliberately NOT offered by any server: sign-in, MFA and sessions (a connection is already
 * signed in), MCP's own consent and connections (Claude never approves itself), and the WhatsApp
 * channel (it holds the Meta access token).
 */
export const SHARED_TYPEDEFS = [searchTypeDefs, tableTransferTypeDefs] as const;
