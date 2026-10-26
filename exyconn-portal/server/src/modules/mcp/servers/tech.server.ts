import { techTypeDefs } from '../../tech/tech.typeDefs';
import { techRevealTypeDefs } from '../../tech/tech.reveal.typeDefs';
import { techUsageTypeDefs } from '../../tech/tech.usage.typeDefs';
import { techVaultTypeDefs } from '../../tech/vault/vault.typeDefs';
import { providerProfileTypeDefs } from '../../tech/providers/provider-profile.typeDefs';
import { techTransferTypeDefs } from '../../tech/transfer/transfer.typeDefs';
import { emailTypeDefs } from '../../email/email.typeDefs';
import { dnsTypeDefs } from '../../dns/dns.typeDefs';
import { infraTypeDefs } from '../../infra/infra.typeDefs';
import { securityTypeDefs } from '../../security/security.typeDefs';
import { logsTypeDefs } from '../../logs/logs.typeDefs';
import { callingBotTypeDefs } from '../../calling-bot-demo/calling-bot.typeDefs';
import { ROLES } from '../../../constants/roles';
import type { McpServerSpec } from './spec';

/**
 * Tech as an MCP server: environment variables and their usage, providers, transfers, email
 * templates, DNS, infrastructure, security, app logs and the calling bot. Credentials stay out
 * (see EXCLUDED in mcp.tools.ts).
 *
 * A Tech feature added to one of these typeDefs is a tool the next time the server starts.
 * A NEW Tech module adds its typeDefs here — see docs/portal/mcp/README.md.
 */
export const TECH_MCP: McpServerSpec = {
  key: 'tech',
  name: 'exyconn-tech',
  label: 'Tech',
  role: ROLES.TECH,
  auditModule: 'Tech (Claude MCP)',
  instructions:
    'Exyconn Tech: environment variables and provider usage, provider profiles, transfers, email templates, DNS, infrastructure, security, app logs and the calling bot. Credentials are never offered. Every tool runs as the signed-in person with their own permissions; read before you change, and confirm with the person before deleting anything or changing DNS, infrastructure or security settings.',
  typeDefs: [
    techTypeDefs,
    techRevealTypeDefs,
    techUsageTypeDefs,
    techVaultTypeDefs,
    providerProfileTypeDefs,
    techTransferTypeDefs,
    emailTypeDefs,
    dnsTypeDefs,
    infraTypeDefs,
    securityTypeDefs,
    logsTypeDefs,
    callingBotTypeDefs,
  ],
};
