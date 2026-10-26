import { Types } from 'mongoose';
import { useTestOrganization } from '../../../helpers';
import { mcpResolvers } from '../../../../src/modules/mcp/mcp.resolvers';
import { McpCallModel, McpTokenModel } from '../../../../src/modules/mcp/data/mcp.models';
import { mcpActivity, mcpUsage } from '../../../../src/modules/mcp/data/mcp.usage';
import { auditActionOf } from '../../../../src/modules/mcp/core/mcp.server';
import {
  endpointTool,
  liveSchema,
  useSchema,
} from '../../../../src/modules/mcp/core/mcp.catalogue';
import { assignLegacyMcpToCrm } from '../../../../src/modules/mcp/data/mcp.migrate';
import { MCP_SERVERS } from '../../../../src/modules/mcp/servers';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { buildSchema } from 'graphql';
import { codeOf } from '../codeOf';

const organizationId = useTestOrganization();

type Resolver = (parent: unknown, args: Record<string, unknown>, ctx: GraphQLContext) => unknown;
const Query = mcpResolvers.Query as unknown as Record<string, Resolver>;
const Mutation = mcpResolvers.Mutation as unknown as Record<string, Resolver>;

const ctx: GraphQLContext = {
  user: { id: 'u1', email: 'a@x.com', roles: [ROLES.CRM], organizationId },
  organizationId,
};
const now = new Date('2026-10-24T12:00:00Z');

const call = (
  tool: string,
  ok: boolean,
  at: string,
  userName = 'Asha',
  durationMs = 10,
  server = 'crm',
) =>
  McpCallModel.create({
    server,
    userId: 'u1',
    userName,
    clientName: 'Claude',
    tool,
    kind: 'QUERY',
    ok,
    durationMs,
    at: new Date(at),
  });

describe('MCP usage', () => {
  it('adds up calls by day, tool and person over the window', async () => {
    await call('searchLeads', true, '2026-10-24T08:00:00Z', 'Asha', 10);
    await call('searchLeads', false, '2026-10-23T08:00:00Z', 'Ravi', 30);
    await call('createDeal', true, '2026-10-24T09:00:00Z');
    await call('old', true, '2026-01-01T09:00:00Z');
    await call('queueCampaignSend', true, '2026-10-24T09:30:00Z', 'Asha', 10, 'marketing');

    const usage = await mcpUsage(['crm'], 2, now);
    expect((await mcpUsage(['crm', 'marketing'], 2, now)).calls).toBe(4);

    expect(usage).toMatchObject({ calls: 3, failures: 1, people: 2 });
    expect(usage.days).toEqual([
      { day: '2026-10-23', calls: 1, failures: 1 },
      { day: '2026-10-24', calls: 2, failures: 0 },
    ]);
    expect(usage.tools[0]).toEqual({ tool: 'searchLeads', calls: 2, failures: 1, averageMs: 20 });
    expect(usage.users).toEqual([
      { userName: 'Asha', calls: 2 },
      { userName: 'Ravi', calls: 1 },
    ]);
  });

  it('lists the newest calls first, as many as asked within the cap', async () => {
    await call('a', true, '2026-10-24T08:00:00Z');
    await call('b', true, '2026-10-24T09:00:00Z');
    await call('m', true, '2026-10-24T10:00:00Z', 'Asha', 10, 'marketing');
    expect((await mcpActivity(['crm'], 1, 1, now)).map((row) => row.tool)).toEqual(['b']);
    expect((await mcpActivity(['crm'], 1, undefined, now)).map((row) => row.tool)).toEqual([
      'b',
      'a',
    ]);
    expect((await mcpActivity(['marketing'], 1, undefined, now)).map((row) => row.tool)).toEqual([
      'm',
    ]);
  });

  it.each([0, 181, 1.5])('refuses a window of %s days', async (days) => {
    expect(await codeOf(mcpUsage(['crm'], days))).toBe('BAD_USER_INPUT');
    expect(await codeOf(mcpActivity(['crm'], days))).toBe('BAD_USER_INPUT');
  });

  it('files the calls and connections from before there were several servers under the CRM', async () => {
    const old = await call('searchLeads', true, new Date().toISOString());
    await McpCallModel.collection.updateOne({ _id: old._id }, { $unset: { server: 1 } });
    const connection = await runAsPlatform(() =>
      McpTokenModel.create({
        endpoint: 'crm',
        clientId: 'c0',
        userId: 'u1',
        organizationId,
        accessHash: 'old-a',
        refreshHash: 'old-r',
        accessExpiresAt: new Date(Date.now() + 60_000),
        refreshExpiresAt: new Date(Date.now() + 60_000),
      }),
    );
    await McpTokenModel.collection.updateOne({ _id: connection._id }, { $unset: { endpoint: 1 } });
    await runAsPlatform(assignLegacyMcpToCrm);
    expect((await McpCallModel.findOne({ tool: 'searchLeads' }).lean())?.server).toBe('crm');
    const token = await runAsPlatform(() => McpTokenModel.findOne({ clientId: 'c0' }).lean());
    expect(token?.endpoint).toBe('crm');
  });
});

describe('MCP resolvers', () => {
  beforeAll(() => {
    useSchema(
      buildSchema(
        'type Query { crmPing: Int, campaignPing: Int } type Mutation { addThing: Int, sharedThing: Int }',
      ),
      {
        crm: { query: new Set(['crmPing']), mutation: new Set(['addThing', 'sharedThing']) },
        marketing: { query: new Set(['campaignPing']), mutation: new Set(['sharedThing']) },
      },
    );
  });

  it('lists the servers the caller may use, each with its address and tools', async () => {
    const servers = (await Query.mcpServers(null, {}, ctx)) as Array<Record<string, unknown>>;
    expect(servers.map((server) => [server.endpoint, server.toolCount])).toEqual([
      ['CRM', 3],
      ['ALL', 3],
    ]);
    expect(servers[0]).toMatchObject({
      label: 'CRM',
      serverUrl: expect.stringMatching(/\/mcp\/crm$/),
      queryCount: 1,
      mutationCount: 2,
      connectionCount: 0,
    });
    const admin = { ...ctx, user: { ...ctx.user!, roles: [ROLES.ADMIN] } };
    const all = (await Query.mcpServers(null, {}, admin)) as Array<Record<string, unknown>>;
    const toolCounts: Record<string, number> = { CRM: 3, MARKETING: 2, ALL: 4 };
    expect(all.map((server) => [server.endpoint, server.toolCount])).toEqual(
      [...MCP_SERVERS.map((spec) => spec.key.toUpperCase()), 'ALL'].map((endpoint) => [
        endpoint,
        toolCounts[endpoint] ?? 0,
      ]),
    );
    const employee = { ...ctx, user: { ...ctx.user!, roles: [ROLES.EMPLOYEE] } };
    const own = (await Query.mcpServers(null, {}, employee)) as Array<Record<string, unknown>>;
    expect(own.map((server) => server.endpoint)).toEqual(['EMPLOYEE', 'SOCIAL', 'ALL']);
    const nobody = { ...ctx, user: { ...ctx.user!, roles: [] } };
    expect(await Query.mcpServers(null, {}, nobody)).toEqual([]);
    const platform = { ...ctx, organizationId: null };
    expect(await Query.mcpServers(null, {}, platform)).toHaveLength(2);
  });

  it('lists a server’s tools with their arguments, for its own users only', async () => {
    const tools = (await Query.mcpTools(null, { endpoint: 'CRM' }, ctx)) as Array<{
      name: string;
      server: string;
      arguments: [];
    }>;
    expect(tools.map((tool) => [tool.name, tool.server, tool.arguments])).toEqual([
      ['addThing', 'CRM', []],
      ['crmPing', 'CRM', []],
      ['sharedThing', 'CRM', []],
    ]);
    expect(
      await codeOf(
        Promise.resolve().then(() => Query.mcpTools(null, { endpoint: 'MARKETING' }, ctx)),
      ),
    ).toBe('FORBIDDEN');
    expect(liveSchema()).toBeDefined();
    expect(endpointTool('crm', [ROLES.CRM], 'nothing')).toBeUndefined();
    expect(endpointTool('all', [ROLES.MARKETING], 'crmPing')).toBeUndefined();
  });

  it('reads usage and activity in the caller’s company, for the server’s users only', async () => {
    await call('crmPing', true, new Date().toISOString());
    await call('campaignPing', true, new Date().toISOString(), 'Asha', 10, 'marketing');
    expect(await Query.mcpUsage(null, { endpoint: 'CRM', days: 7 }, ctx)).toMatchObject({
      calls: 1,
    });
    expect(await Query.mcpUsage(null, { endpoint: 'ALL', days: 7 }, ctx)).toMatchObject({
      calls: 1,
    });
    const rows = (await Query.mcpActivity(
      null,
      { endpoint: 'CRM', days: 7, limit: null },
      ctx,
    )) as Array<{ server: string }>;
    expect(rows.map((row) => row.server)).toEqual(['CRM']);
    expect(await Query.mcpActivity(null, { endpoint: 'CRM', days: 7, limit: 5 }, ctx)).toHaveLength(
      1,
    );
    const marketer = { ...ctx, user: { ...ctx.user!, roles: [ROLES.MARKETING] } };
    expect(
      await Query.mcpActivity(null, { endpoint: 'ALL', days: 7, limit: 5 }, marketer),
    ).toHaveLength(1);
    const employee = { ...ctx, user: { ...ctx.user!, roles: [ROLES.EMPLOYEE] } };
    expect(
      await codeOf(
        Promise.resolve().then(() => Query.mcpUsage(null, { endpoint: 'CRM', days: 7 }, employee)),
      ),
    ).toBe('FORBIDDEN');
    const outsider = { ...ctx, user: { ...ctx.user!, roles: [] } };
    for (const endpoint of ['CRM', 'ALL']) {
      expect(
        await codeOf(
          Promise.resolve().then(() => Query.mcpUsage(null, { endpoint, days: 7 }, outsider)),
        ),
      ).toBe('FORBIDDEN');
    }
    const noCompany = { ...ctx, organizationId: null };
    for (const run of [
      () => Query.mcpConnections(null, { endpoint: 'CRM' }, noCompany),
      () => Query.mcpUsage(null, { endpoint: 'CRM', days: 7 }, noCompany),
      () => Query.mcpActivity(null, { endpoint: 'CRM', days: 7 }, noCompany),
    ]) {
      expect(await codeOf(Promise.resolve().then(run))).toBe('BAD_USER_INPUT');
    }
  });

  it('lists the company’s live connections and signs one out, audited', async () => {
    const person = await UserModel.create({
      name: 'Asha',
      email: 'asha@exyconn.com',
      passwordHash: `hash-${Date.now()}`,
      roles: [ROLES.CRM],
    });
    const token = (fields: Record<string, unknown>) =>
      runAsPlatform(() =>
        McpTokenModel.create({
          endpoint: 'crm',
          clientId: 'c1',
          clientName: '',
          userId: String(person._id),
          organizationId,
          accessHash: new Types.ObjectId().toHexString(),
          refreshHash: new Types.ObjectId().toHexString(),
          accessExpiresAt: new Date(Date.now() + 60_000),
          refreshExpiresAt: new Date(Date.now() + 60_000),
          ...fields,
        }),
      );
    const live = await token({});
    await token({ revokedAt: new Date() });
    await token({ organizationId: new Types.ObjectId().toHexString() });
    await token({ userId: new Types.ObjectId().toHexString(), clientName: 'Other' });
    const global = await token({ endpoint: 'all', clientName: 'Global' });
    const marketing = await token({ endpoint: 'marketing', clientName: 'Campaigns' });

    const rows = (await Query.mcpConnections(null, { endpoint: 'CRM' }, ctx)) as Array<
      Record<string, unknown>
    >;
    expect(rows.map((row) => [row.clientName, row.userName, row.endpoint])).toEqual([
      ['Other', '', 'CRM'],
      ['MCP client', 'Asha', 'CRM'],
    ]);
    const every = (await Query.mcpConnections(null, { endpoint: 'ALL' }, ctx)) as Array<
      Record<string, unknown>
    >;
    expect(every.map((row) => row.clientName)).toEqual(['Global', 'Other', 'MCP client']);
    const servers = (await Query.mcpServers(null, {}, ctx)) as Array<Record<string, unknown>>;
    expect(servers.map((server) => server.connectionCount)).toEqual([2, 1]);
    expect(
      await codeOf(
        Promise.resolve().then(() =>
          Mutation.revokeMcpConnection(null, { id: String(marketing._id) }, ctx),
        ),
      ),
    ).toBe('FORBIDDEN');
    await expect(Mutation.revokeMcpConnection(null, { id: String(global._id) }, ctx)).resolves.toBe(
      true,
    );
    await expect(Mutation.revokeMcpConnection(null, { id: String(live._id) }, ctx)).resolves.toBe(
      true,
    );
    expect(
      await codeOf(
        Promise.resolve(Mutation.revokeMcpConnection(null, { id: String(live._id) }, ctx)),
      ),
    ).toBe('NOT_FOUND');
    expect(
      await codeOf(Promise.resolve(Mutation.revokeMcpConnection(null, { id: 'bad' }, ctx))),
    ).toBe('NOT_FOUND');
  });
});

describe('the consent resolvers', () => {
  it('answer a sign-in that is not there as not found', async () => {
    const id = new Types.ObjectId().toHexString();
    for (const run of [
      () => Query.mcpAuthorizationRequest(null, { id }, ctx),
      () => Mutation.approveMcpAuthorization(null, { id }, ctx),
      () => Mutation.denyMcpAuthorization(null, { id }, ctx),
    ]) {
      expect(await codeOf(Promise.resolve().then(run))).toBe('NOT_FOUND');
    }
  });
});

describe('audit actions', () => {
  it.each([
    ['deleteLead', 'DELETE'],
    ['archiveCompany', 'DELETE'],
    ['createDeal', 'CREATE'],
    ['sendColdEmail', 'CREATE'],
    ['publishSocialMediaPostNow', 'CREATE'],
    ['queueCampaignSend', 'CREATE'],
    ['updateContact', 'UPDATE'],
  ])('%s reads as %s', (tool, action) => {
    expect(auditActionOf(tool)).toBe(action);
  });
});
