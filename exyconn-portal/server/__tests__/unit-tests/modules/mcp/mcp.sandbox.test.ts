import express from 'express';
import request from 'supertest';
import gql from 'graphql-tag';
import { Types } from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { env } from '../../../../src/config/env';
import { ROLES } from '../../../../src/constants/roles';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { AuditLogModel } from '../../../../src/modules/audit';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { DealModel } from '../../../../src/modules/crm/deal.model';
import { TaskModel } from '../../../../src/modules/projects/board.model';
import { mcpRouter } from '../../../../src/modules/mcp/core/mcp.router';
import {
  liveSchema,
  mcpSchemaPlugin,
  useSchema,
} from '../../../../src/modules/mcp/core/mcp.catalogue';
import { McpSettingsModel } from '../../../../src/modules/mcp/data/mcp.settings';
import { McpTokenModel } from '../../../../src/modules/mcp/data/mcp.models';
import {
  ensureMcpSandbox,
  mcpSandboxResolvers,
  mcpSandboxTypeDefs,
} from '../../../../src/modules/mcp/sandbox';
import {
  mcpSandbox,
  SANDBOX_DISABLED_TOOLS,
} from '../../../../src/modules/mcp/sandbox/sandbox.org';
import { SANDBOX_COMPANIES, SANDBOX_DEALS } from '../../../../src/modules/mcp/sandbox/sandbox.data';
import { logger } from '../../../../src/utils/logger';

const { Query, Mutation } = mcpSandboxResolvers;
const ACCEPT = 'application/json, text/event-stream';

const visitorCtx = (id: string, email: string): GraphQLContext => ({
  user: null,
  ip: '198.51.100.7',
  demoVisitor: {
    id,
    name: 'Asha',
    email,
    phone: '',
    company: 'Acme',
    organizationId: new Types.ObjectId().toHexString(),
  },
});
const asha = visitorCtx('v1', 'asha@example.com');
const ravi: GraphQLContext = { ...visitorCtx('v2', 'ravi@example.com'), ip: undefined };

/** A small stand-in for the CRM: one read that says who and where it ran, and one change. */
const typeDefs = gql`
  type Query {
    "Counts the company's CRM companies, as the caller."
    crmCompanyCount: String!
  }
  type Mutation {
    "Deletes a CRM company."
    deleteCrmCompany(id: ID!): Boolean!
  }
`;
const resolvers = {
  Query: {
    crmCompanyCount: async (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      `${await CompanyModel.countDocuments()} companies for ${ctx.user?.email}`,
  },
  Mutation: { deleteCrmCompany: () => true },
};

const app = express();
app.use(mcpRouter());

const rpc = (token: string, method: string, params: Record<string, unknown> = {}) =>
  request(app)
    .post('/mcp/all')
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', ACCEPT)
    .send({ jsonrpc: '2.0', id: 1, method, params });

const issue = (ctx: GraphQLContext) => Mutation.issueMcpSandboxToken(undefined, {}, ctx);

/** Runs inside the sandbox company. */
async function inSandbox<T>(work: () => Promise<T>): Promise<T> {
  const sandbox = await mcpSandbox();
  return runForOrganization(sandbox.organizationId, work);
}

beforeAll(async () => {
  const apollo = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: [mcpSchemaPlugin],
  });
  await apollo.start();
  useSchema(liveSchema(), {
    crm: { query: new Set(['crmCompanyCount']), mutation: new Set(['deleteCrmCompany']) },
  });
});

afterEach(() => jest.restoreAllMocks());

describe('the sandbox company', () => {
  it('is seeded once with sample records and set to read only, with costly tools off', async () => {
    await ensureMcpSandbox();
    await ensureMcpSandbox();
    const sandbox = await mcpSandbox();
    const analyst = await runAsPlatform(() => UserModel.findById(sandbox.accountId).lean());
    expect(analyst?.roles).toEqual([ROLES.EMPLOYEE, ROLES.CRM, ROLES.PROJECTS, ROLES.HR]);
    await inSandbox(async () => {
      expect(await CompanyModel.countDocuments()).toBe(SANDBOX_COMPANIES.length);
      expect(await DealModel.countDocuments()).toBe(SANDBOX_DEALS.length);
      expect(await TaskModel.countDocuments()).toBe(10);
      const team = await UserModel.find({ email: /@exyconn-sandbox\.example$/ }).lean();
      expect(team.map((member) => member.email)).toContain('liam.oconnor@exyconn-sandbox.example');
      const settings = await McpSettingsModel.findOne({ key: 'global' }).lean();
      expect(settings?.disabledTools).toEqual(SANDBOX_DISABLED_TOOLS);
      expect(settings?.readOnlyServers).toContain('crm');
      expect(settings?.callsPerHourPerConnection).toBe(env.demos.mcpSandbox.callsPerHour);
    });
  });

  it('logs a failed preparation and lets boot carry on', async () => {
    jest.spyOn(McpSettingsModel, 'updateOne').mockRejectedValueOnce(new Error('db down'));
    const error = jest.spyOn(logger, 'error').mockImplementation(() => logger);
    await expect(ensureMcpSandbox()).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'MCP sandbox could not be prepared',
    );
  });
});

describe('what the sandbox page shows', () => {
  it('turns away a caller who is neither a demo visitor nor an employee', async () => {
    await expect(Query.mcpSandboxInfo(undefined, {}, { user: null })).rejects.toThrow();
  });

  it('gives the global address, the limits, the modules and the sample counts', async () => {
    await ensureMcpSandbox();
    const info = await Query.mcpSandboxInfo(undefined, {}, asha);
    expect(info).toMatchObject({
      organizationName: 'Exyconn MCP Sandbox',
      endpointUrl: `${env.apiPublicUrl}/mcp/all`,
      tokenTtlMinutes: env.demos.mcpSandbox.tokenTtlMinutes,
      tokensLeftToday: env.demos.mcpSandbox.tokensPerDay,
      callsPerHour: env.demos.mcpSandbox.callsPerHour,
    });
    expect(info.modules).toEqual(expect.arrayContaining(['CRM', 'Projects', 'HR']));
    expect(info.sample).toContainEqual({ label: 'Companies', count: SANDBOX_COMPANIES.length });
  });

  it('shows an empty company name when the sandbox company cannot be read', async () => {
    await mcpSandbox();
    jest.spyOn(UserModel, 'findById').mockReturnValueOnce({
      select: () => ({ lean: () => Promise.resolve(null) }),
    } as never);
    jest.spyOn(OrganizationModel, 'findById').mockReturnValueOnce({
      select: () => ({ lean: () => Promise.resolve(null) }),
    } as never);
    const info = await Query.mcpSandboxInfo(undefined, {}, asha);
    expect(info.organizationName).toBe('');
    expect(info.modules).toEqual([]);
  });
});

describe('sandbox tokens', () => {
  it('issues a read-only token for /mcp/all that lists and runs only reads, as the analyst', async () => {
    await ensureMcpSandbox();
    const { token, sandboxToken } = await issue(asha);
    expect(sandboxToken.active).toBe(true);
    const row = await runAsPlatform(() => McpTokenModel.findById(sandboxToken.id).lean());
    const sandbox = await mcpSandbox();
    expect(row).toMatchObject({
      endpoint: 'all',
      readOnly: true,
      clientId: 'mcp-sandbox:visitor:v1',
      userId: sandbox.accountId,
      organizationId: sandbox.organizationId,
    });
    expect(row?.accessHash).not.toBe(token);
    const minutes = ((row?.accessExpiresAt.getTime() ?? 0) - Date.now()) / 60_000;
    expect(Math.round(minutes)).toBe(env.demos.mcpSandbox.tokenTtlMinutes);

    const listed = await rpc(token, 'tools/list');
    expect(listed.status).toBe(200);
    const names = (listed.body.result.tools as Array<{ name: string }>).map((tool) => tool.name);
    expect(names).toEqual(['crmCompanyCount']);
    const ran = await rpc(token, 'tools/call', { name: 'crmCompanyCount', arguments: {} });
    expect(ran.body.result.content[0].text).toContain(
      `${SANDBOX_COMPANIES.length} companies for analyst@exyconn-sandbox.example`,
    );
    const change = await rpc(token, 'tools/call', {
      name: 'deleteCrmCompany',
      arguments: { id: 'x' },
    });
    expect(change.body.result.isError).toBe(true);
    expect(change.body.result.content[0].text).toContain('may only read');
    const [used] = await Query.mcpSandboxTokens(undefined, {}, asha);
    expect(used.lastUsedAt).toBeInstanceOf(Date);

    const audit = await inSandbox(() => AuditLogModel.findOne({ module: 'MCP sandbox' }).lean());
    expect(audit).toMatchObject({ action: 'CREATE', actorId: 'visitor:v1', ip: '198.51.100.7' });
  });

  it('keeps one live token per visitor, and lists only the visitor’s own', async () => {
    const first = await issue(asha);
    const second = await issue(asha);
    await issue(ravi);
    const listed = await Query.mcpSandboxTokens(undefined, {}, asha);
    expect(listed.map((token) => token.id)).toEqual([
      second.sandboxToken.id,
      first.sandboxToken.id,
    ]);
    expect(listed.map((token) => token.active)).toEqual([true, false]);
    expect((await rpc(first.token, 'tools/list')).status).toBe(401);
  });

  it('stops a visitor at the daily limit', async () => {
    jest.replaceProperty(env.demos.mcpSandbox, 'tokensPerDay', 1);
    await issue(asha);
    await expect(issue(asha)).rejects.toThrow('used today’s sandbox tokens');
    expect((await Query.mcpSandboxInfo(undefined, {}, asha)).tokensLeftToday).toBe(0);
  });

  it('revokes the visitor’s own token at once, audited, and nobody else’s', async () => {
    const { token, sandboxToken } = await issue(asha);
    await expect(
      Mutation.revokeMcpSandboxToken(undefined, { id: sandboxToken.id }, ravi),
    ).rejects.toThrow('not found');
    await expect(
      Mutation.revokeMcpSandboxToken(undefined, { id: 'not-an-id' }, asha),
    ).rejects.toThrow('not found');
    const revoked = await Mutation.revokeMcpSandboxToken(undefined, { id: sandboxToken.id }, asha);
    expect(revoked).toMatchObject({ id: sandboxToken.id, active: false });
    expect(revoked.revokedAt).toBeInstanceOf(Date);
    expect((await rpc(token, 'tools/list')).status).toBe(401);
    const audits = await inSandbox(() =>
      AuditLogModel.find({ module: 'MCP sandbox', action: 'UPDATE' }).lean(),
    );
    expect(audits).toHaveLength(1);
  });

  it('reads an expired token as inactive', async () => {
    const { sandboxToken } = await issue(asha);
    await runAsPlatform(() =>
      McpTokenModel.updateOne(
        { _id: sandboxToken.id },
        { $set: { accessExpiresAt: new Date(Date.now() - 1000) } },
      ),
    );
    const [listed] = await Query.mcpSandboxTokens(undefined, {}, asha);
    expect(listed.active).toBe(false);
  });
});

describe('the schema', () => {
  it('describes every sandbox operation for the API reference', () => {
    const body = mcpSandboxTypeDefs.loc?.source.body ?? '';
    for (const name of [
      'mcpSandboxInfo',
      'mcpSandboxTokens',
      'issueMcpSandboxToken',
      'revokeMcpSandboxToken',
    ]) {
      expect(body).toMatch(new RegExp(`"[^"]+"\\s+${name}`));
    }
  });
});
