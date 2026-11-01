import { env } from '../../../config/env';
import { ROLES } from '../../../constants/roles';
import { runOnce } from '../../../lib/migrations';
import { runForOrganization } from '../../../lib/tenant';
import { logger } from '../../../utils/logger';
import {
  ensureDemoOrganization,
  type DemoOrganization,
  type DemoOrganizationSpec,
} from '../../organizations';
import { McpSettingsModel } from '../data/mcp.settings';
import { MCP_SERVERS } from '../servers';
import { seedSandboxRecords } from './sandbox.seed';

/** The sandbox company's own domain: its team's (unreachable) addresses end with it. */
const SANDBOX_DOMAIN = 'exyconn-sandbox.example';

/**
 * The company the MCP sandbox reads: invented sample records, no real customer anywhere near
 * it. Sandbox tokens act as its analyst, who may read the CRM, Projects, HR and their own
 * self-service records and nothing else.
 */
const SANDBOX: DemoOrganizationSpec = {
  slug: 'exyconn-mcp-sandbox',
  name: 'Exyconn MCP Sandbox',
  industry: 'Software',
  description:
    'Public demo company with sample records, read by the MCP sandbox on demos.exyconn.com.',
  currency: 'USD',
  country: 'US',
  timezone: 'UTC',
  account: {
    name: 'Sandbox Analyst',
    email: `analyst@${SANDBOX_DOMAIN}`,
    roles: [ROLES.EMPLOYEE, ROLES.CRM, ROLES.PROJECTS, ROLES.HR],
  },
};

/**
 * Read-only tools that call a paid outside service or a connected mailbox: switched off in the
 * sandbox, so a public visitor never spends the install's Google Maps, Firecrawl or mail quota.
 */
export const SANDBOX_DISABLED_TOOLS = [
  'companyGoogleBusiness',
  'searchLeadPlaces',
  'leadLocationSuggestions',
  'placeCoordinates',
  'previewLeadImport',
  'webScrapeAiEstimate',
  'crmEmailThreads',
  'crmEmailThreadPage',
  'crmMailThread',
  'crmMailAttachment',
  'tableExport',
];

/** The sandbox company and the analyst account its tokens act as. */
export const mcpSandbox = (): Promise<DemoOrganization> => ensureDemoOrganization(SANDBOX);

/**
 * The sandbox's MCP settings, set on every boot from the demo's configuration: every server reads
 * only, the costly tools are off, and each token (one connection) gets its own hourly limit.
 */
async function applySandboxSettings(): Promise<void> {
  await McpSettingsModel.updateOne(
    { key: 'global' },
    {
      $set: {
        readOnlyServers: MCP_SERVERS.map((spec) => spec.key),
        disabledTools: SANDBOX_DISABLED_TOOLS,
        callsPerHourPerConnection: env.demos.mcpSandbox.callsPerHour,
        callsPerHourPerPerson: 0,
        writesPerHourPerPerson: 0,
        alertsEnabled: false,
      },
    },
    { upsert: true },
  );
}

/** Boot: the sandbox company, its sample records (once) and its settings. Never stops boot. */
export async function ensureMcpSandbox(): Promise<void> {
  try {
    const sandbox = await mcpSandbox();
    await runForOrganization(sandbox.organizationId, async () => {
      await runOnce('mcp-sandbox-sample-records', () => seedSandboxRecords(SANDBOX_DOMAIN));
      await applySandboxSettings();
    });
  } catch (error) {
    logger.error({ err: error }, 'MCP sandbox could not be prepared');
  }
}
