import { env } from '../../../config/env';
import type { Role } from '../../../constants/roles';
import type { DemoCaller } from '../../../lib/demoCaller';
import { runAsPlatform, runForOrganization } from '../../../lib/tenant';
import { UserModel } from '../../admin/user.model';
import { CompanyModel } from '../../crm/company.model';
import { ContactModel } from '../../crm/contact.model';
import { LeadModel } from '../../crm/crm.model';
import { DealModel } from '../../crm/deal.model';
import { OrganizationModel } from '../../organizations';
import { TaskModel } from '../../projects/board.model';
import { ProjectModel } from '../../projects/projects.model';
import { GLOBAL_MCP, MCP_ENDPOINT_PATHS, serversOf } from '../servers';
import { mcpSandbox } from './sandbox.org';
import { tokensLeftToday } from './sandbox.tokens';

/** How many sample records of each kind the sandbox holds, as the page lists them. */
async function sampleCounts() {
  const [companies, contacts, leads, deals, projects, tickets, people] = await Promise.all([
    CompanyModel.countDocuments(),
    ContactModel.countDocuments(),
    LeadModel.countDocuments(),
    DealModel.countDocuments(),
    ProjectModel.countDocuments(),
    TaskModel.countDocuments(),
    UserModel.countDocuments(),
  ]);
  return [
    { label: 'Companies', count: companies },
    { label: 'Contacts', count: contacts },
    { label: 'Leads', count: leads },
    { label: 'Deals', count: deals },
    { label: 'Projects', count: projects },
    { label: 'Tickets', count: tickets },
    { label: 'People', count: people },
  ];
}

/**
 * What the sandbox page shows before a token is taken: the address to connect, the token's
 * window and limits, the modules its tools come from and the sample records behind them.
 */
export async function sandboxInfo(caller: DemoCaller) {
  const sandbox = await mcpSandbox();
  const [organization, account] = await runAsPlatform(() =>
    Promise.all([
      OrganizationModel.findById(sandbox.organizationId).select('name').lean(),
      UserModel.findById(sandbox.accountId).select('roles').lean(),
    ]),
  );
  const roles = (account?.roles ?? []) as Role[];
  const { tokenTtlMinutes, tokensPerDay, callsPerHour } = env.demos.mcpSandbox;
  return {
    organizationName: organization?.name ?? '',
    serverName: GLOBAL_MCP.name,
    endpointUrl: `${env.apiPublicUrl}${MCP_ENDPOINT_PATHS.all}`,
    tokenTtlMinutes,
    tokensPerDay,
    tokensLeftToday: await tokensLeftToday(caller),
    callsPerHour,
    modules: serversOf('all', roles).map((spec) => spec.label),
    sample: await runForOrganization(sandbox.organizationId, sampleCounts),
  };
}
