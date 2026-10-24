import { Types } from 'mongoose';
import { useTestOrganization } from '../../../helpers';
import { mcpResolvers } from '../../../../src/modules/mcp/mcp.resolvers';
import { McpCallModel, McpTokenModel } from '../../../../src/modules/mcp/mcp.models';
import { mcpActivity, mcpUsage } from '../../../../src/modules/mcp/mcp.usage';
import { auditActionOf } from '../../../../src/modules/mcp/mcp.server';
import { liveSchema, mcpTool, useSchema } from '../../../../src/modules/mcp/mcp.crm';
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

const call = (tool: string, ok: boolean, at: string, userName = 'Asha', durationMs = 10) =>
  McpCallModel.create({
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

    const usage = await mcpUsage(2, now);

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
    expect((await mcpActivity(1, 1, now)).map((row) => row.tool)).toEqual(['b']);
    expect((await mcpActivity(1, undefined, now)).map((row) => row.tool)).toEqual(['b', 'a']);
  });

  it.each([0, 181, 1.5])('refuses a window of %s days', async (days) => {
    expect(await codeOf(mcpUsage(days))).toBe('BAD_USER_INPUT');
    expect(await codeOf(mcpActivity(days))).toBe('BAD_USER_INPUT');
  });
});

describe('MCP resolvers', () => {
  beforeAll(() => {
    useSchema(buildSchema('type Query { crmPing: Int  } type Mutation { addThing: Int }'), {
      query: new Set(['crmPing']),
      mutation: new Set(['addThing']),
    });
  });

  it('says where to connect and lists the tools with their arguments', async () => {
    expect(await Query.mcpOverview(null, {}, ctx)).toEqual({
      serverUrl: expect.stringMatching(/\/mcp$/),
      toolCount: 2,
      queryCount: 1,
      mutationCount: 1,
    });
    const tools = (await Query.mcpTools(null, {}, ctx)) as Array<{ name: string; arguments: [] }>;
    expect(tools.map((tool) => [tool.name, tool.arguments])).toEqual([
      ['addThing', []],
      ['crmPing', []],
    ]);
    expect(liveSchema()).toBeDefined();
    expect(mcpTool('nothing')).toBeUndefined();
  });

  it('reads usage and activity in the caller’s company, for CRM users only', async () => {
    await call('crmPing', true, new Date().toISOString());
    expect(await Query.mcpUsage(null, { days: 7 }, ctx)).toMatchObject({ calls: 1 });
    expect(await Query.mcpActivity(null, { days: 7, limit: null }, ctx)).toHaveLength(1);
    expect(await Query.mcpActivity(null, { days: 7, limit: 5 }, ctx)).toHaveLength(1);
    const outsider = { ...ctx, user: { ...ctx.user!, roles: [ROLES.EMPLOYEE] } };
    expect(
      await codeOf(Promise.resolve().then(() => Query.mcpUsage(null, { days: 7 }, outsider))),
    ).toBe('FORBIDDEN');
    const noCompany = { ...ctx, organizationId: null };
    expect(
      await codeOf(Promise.resolve().then(() => Query.mcpConnections(null, {}, noCompany))),
    ).toBe('BAD_USER_INPUT');
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

    const rows = (await Query.mcpConnections(null, {}, ctx)) as Array<Record<string, unknown>>;
    expect(rows.map((row) => [row.clientName, row.userName])).toEqual([
      ['Other', ''],
      ['MCP client', 'Asha'],
    ]);
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
    ['updateContact', 'UPDATE'],
  ])('%s reads as %s', (tool, action) => {
    expect(auditActionOf(tool)).toBe(action);
  });
});
