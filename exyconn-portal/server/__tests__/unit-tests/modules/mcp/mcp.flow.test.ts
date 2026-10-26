import { createHash, randomBytes } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import gql from 'graphql-tag';
import { ApolloServer } from '@apollo/server';
import { useTestOrganization } from '../../../helpers';
import { mcpRouter } from '../../../../src/modules/mcp/core/mcp.router';
import {
  mcpSchemaPlugin,
  useSchema,
  liveSchema,
} from '../../../../src/modules/mcp/core/mcp.catalogue';
import {
  approveAuthorization,
  denyAuthorization,
  describeAuthorization,
} from '../../../../src/modules/mcp/auth/mcp.connect';
import {
  McpCallModel,
  McpClientModel,
  McpTokenModel,
} from '../../../../src/modules/mcp/data/mcp.models';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { logger } from '../../../../src/utils/logger';
import { codeOf } from '../codeOf';

const organizationId = useTestOrganization();

const REDIRECT = 'https://claude.ai/api/mcp/auth_callback';
const ACCEPT = 'application/json, text/event-stream';
const HELLO = {
  protocolVersion: '2025-06-18',
  capabilities: {},
  clientInfo: { name: 'claude', version: '1' },
};

/** A small stand-in for the CRM: one read, one delete, one that always fails. */
const typeDefs = gql`
  type Pong {
    id: ID!
    text: String!
  }
  type Query {
    "Says hello as the caller."
    crmPing(name: String!): Pong!
    crmBig: String!
    "Counts campaigns."
    campaignCount: Int!
  }
  type Mutation {
    deleteThing(id: ID!): Boolean!
    failing: Int!
  }
`;
const resolvers = {
  Query: {
    crmPing: (_p: unknown, { name }: { name: string }, ctx: GraphQLContext) => ({
      id: '1',
      text: `hi ${name} from ${ctx.user?.email}`,
    }),
    crmBig: () => 'x'.repeat(70_000),
    campaignCount: () => 3,
  },
  Mutation: {
    deleteThing: () => true,
    failing: () => {
      throw new Error('nope');
    },
  },
};

const app = express();
app.set('trust proxy', 1);
app.use(mcpRouter());

let user: { id: string; email: string };
let ctx: GraphQLContext;

beforeAll(async () => {
  const apollo = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: [mcpSchemaPlugin],
  });
  await apollo.start();
  useSchema(liveSchema(), {
    crm: { query: new Set(['crmPing', 'crmBig']), mutation: new Set(['deleteThing', 'failing']) },
    marketing: { query: new Set(['campaignCount']), mutation: new Set() },
  });
});

beforeEach(async () => {
  const created = await UserModel.create({
    name: 'Asha',
    email: 'asha@exyconn.com',
    passwordHash: `hash-${Date.now()}`,
    roles: [ROLES.CRM],
    isActive: true,
  });
  user = { id: String(created._id), email: created.email };
  ctx = {
    user: { id: user.id, email: user.email, roles: [ROLES.CRM], organizationId },
    organizationId,
  };
});

function pkce() {
  const verifier = randomBytes(32).toString('base64url');
  return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url') };
}

async function register(): Promise<string> {
  const answer = await request(app)
    .post('/register')
    .send({
      client_name: 'Claude',
      redirect_uris: [REDIRECT],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    });
  expect(answer.status).toBe(201);
  return answer.body.client_id as string;
}

/**
 * Register, authorize (for the server at `path`, or with no resource at all), allow and trade
 * the code: the tokens Claude ends up holding.
 */
async function connect(path?: string, as: GraphQLContext = ctx) {
  const clientId = await register();
  const { verifier, challenge } = pkce();
  const authorize = await request(app)
    .get('/authorize')
    .query({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: REDIRECT,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: 'st-1',
      scope: 'crm',
      ...(path ? { resource: `https://portal-server.exyconn.com${path}` } : {}),
    });
  expect(authorize.status).toBe(302);
  const consent = new URL(authorize.headers.location);
  expect(consent.pathname).toBe('/mcp/connect');
  const id = consent.searchParams.get('request') ?? '';
  expect(await describeAuthorization(as, id)).toMatchObject({
    clientName: 'Claude',
    redirectHost: 'claude.ai',
    scopes: ['crm'],
  });
  const back = new URL(await approveAuthorization(as, id));
  expect(back.searchParams.get('state')).toBe('st-1');
  const token = await request(app)
    .post('/token')
    .type('form')
    .send({
      grant_type: 'authorization_code',
      code: back.searchParams.get('code'),
      code_verifier: verifier,
      client_id: clientId,
      redirect_uri: REDIRECT,
    });
  expect(token.status).toBe(200);
  return { clientId, tokens: token.body as { access_token: string; refresh_token: string } };
}

const rpc = (token: string, method: string, params: Record<string, unknown> = {}, path = '/mcp') =>
  request(app)
    .post(path)
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', ACCEPT)
    .send({ jsonrpc: '2.0', id: 1, method, params });

describe('Claude connecting to the CRM', () => {
  it('publishes its sign-in settings for any origin', async () => {
    const server = await request(app)
      .get('/.well-known/oauth-authorization-server')
      .set('Origin', 'https://claude.ai');
    expect(server.status).toBe(200);
    expect(server.headers['access-control-allow-origin']).toBe('*');
    expect(server.body).toMatchObject({
      authorization_endpoint: expect.stringMatching(/\/authorize$/),
      token_endpoint: expect.stringMatching(/\/token$/),
      registration_endpoint: expect.stringMatching(/\/register$/),
      code_challenge_methods_supported: ['S256'],
    });
    const resource = await request(app).get('/.well-known/oauth-protected-resource/mcp');
    expect(resource.body.resource).toMatch(/\/mcp$/);
    for (const [path, name] of [
      ['/mcp/crm', 'Exyconn CRM'],
      ['/mcp/marketing', 'Exyconn Marketing'],
      ['/mcp/all', 'Exyconn All Exyconn tools'],
    ]) {
      const each = await request(app).get(`/.well-known/oauth-protected-resource${path}`);
      expect(each.body).toMatchObject({ resource: expect.stringMatching(`${path}$`) });
      expect(each.body.resource_name).toBe(name);
    }
  });

  it('turns away an MCP request without a token, pointing at the sign-in settings', async () => {
    const answer = await request(app).post('/mcp').set('Accept', ACCEPT).send({});
    expect(answer.status).toBe(401);
    expect(answer.headers['www-authenticate']).toMatch(/resource_metadata=/);
    expect((await request(app).get('/mcp')).status).toBe(405);
    expect((await request(app).delete('/mcp')).status).toBe(405);
  });

  it('connects, lists the tools and runs them as the person who allowed it', async () => {
    const { tokens } = await connect();

    const init = await rpc(tokens.access_token, 'initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'claude', version: '1' },
    });
    expect(init.status).toBe(200);
    expect(init.body.result.serverInfo.name).toBe('exyconn-crm');

    const list = await rpc(tokens.access_token, 'tools/list');
    const names = list.body.result.tools.map((tool: { name: string }) => tool.name);
    expect(names).toEqual(['crmBig', 'crmPing', 'deleteThing', 'failing']);
    const ping = list.body.result.tools.find((tool: { name: string }) => tool.name === 'crmPing');
    expect(ping.annotations).toEqual({ readOnlyHint: true, destructiveHint: false });
    expect(ping.inputSchema.required).toEqual(['name']);

    const called = await rpc(tokens.access_token, 'tools/call', {
      name: 'crmPing',
      arguments: { name: 'Ravi' },
    });
    expect(JSON.parse(called.body.result.content[0].text)).toEqual({
      id: '1',
      text: 'hi Ravi from asha@exyconn.com',
    });

    const deleted = await rpc(tokens.access_token, 'tools/call', {
      name: 'deleteThing',
      arguments: { id: 'x1' },
    });
    expect(deleted.body.result.content[0].text).toBe('true');

    const failed = await rpc(tokens.access_token, 'tools/call', { name: 'failing' });
    expect(failed.body.result).toMatchObject({ isError: true, content: [{ text: 'nope' }] });

    const unknown = await rpc(tokens.access_token, 'tools/call', { name: 'nothing' });
    expect(unknown.body.result.content[0].text).toBe('There is no CRM tool named nothing.');
    const elsewhere = await rpc(tokens.access_token, 'tools/call', { name: 'campaignCount' });
    expect(elsewhere.body.result.isError).toBe(true);

    const missing = await rpc(tokens.access_token, 'tools/call', { name: 'crmPing' });
    expect(missing.body.result.isError).toBe(true);

    const big = await rpc(tokens.access_token, 'tools/call', { name: 'crmBig' });
    expect(big.body.result.content[0].text).toMatch(/ask for fewer rows/);

    const calls = await McpCallModel.find().sort({ at: 1 }).lean();
    expect(calls.map((call) => [call.tool, call.ok])).toEqual([
      ['crmPing', true],
      ['deleteThing', true],
      ['failing', false],
      ['crmPing', false],
      ['crmBig', true],
    ]);
    expect(calls[0]).toMatchObject({
      server: 'crm',
      userName: 'Asha',
      clientName: 'Claude',
      kind: 'QUERY',
    });
    const audits = await runAsPlatform(() =>
      AuditLogModel.find({ module: 'CRM (Claude MCP)' }).lean(),
    );
    expect(audits.map((entry) => entry.action).sort((a, b) => a.localeCompare(b))).toEqual([
      'DELETE',
      'LOGIN',
    ]);
  });

  it('rotates the refresh token, and a signed-out connection or person loses access', async () => {
    const { clientId, tokens } = await connect();
    const refreshed = await request(app).post('/token').type('form').send({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: clientId,
    });
    expect(refreshed.status).toBe(200);
    const again = await request(app).post('/token').type('form').send({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: clientId,
    });
    expect(again.status).toBe(400);
    expect((await rpc(tokens.access_token, 'tools/list')).status).toBe(401);

    const fresh = refreshed.body.access_token as string;
    await UserModel.updateOne({ _id: user.id }, { isActive: false });
    expect((await rpc(fresh, 'tools/list')).status).toBe(401);

    const revoked = await request(app).post('/revoke').type('form').send({
      token: refreshed.body.refresh_token,
      client_id: clientId,
    });
    expect(revoked.status).toBe(200);
    expect(await runAsPlatform(() => McpTokenModel.countDocuments({ revokedAt: null }))).toBe(0);
  });

  it('connects a platform administrator, in their own company, from the platform view', async () => {
    const clientId = await register();
    const { verifier, challenge } = pkce();
    const authorize = await request(app).get('/authorize').query({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: REDIRECT,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    const id = new URL(authorize.headers.location).searchParams.get('request') ?? '';
    const platformView: GraphQLContext = { ...ctx, organizationId: null };
    const code = new URL(await approveAuthorization(platformView, id)).searchParams.get('code');
    const token = await request(app).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      client_id: clientId,
      redirect_uri: REDIRECT,
      resource: 'https://portal-server.exyconn.com/mcp',
    });
    expect(token.status).toBe(200);
    const row = await runAsPlatform(() => McpTokenModel.findOne({ clientId }).lean());
    expect(row?.organizationId).toBe(organizationId);
  });

  it('logs a refused step without its secrets', async () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const answer = await request(app).post('/token').type('form').send({
      grant_type: 'authorization_code',
      code: 'nope',
      code_verifier: 'x',
      client_id: 'none',
    });
    expect(answer.status).toBeGreaterThanOrEqual(400);
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/token', status: answer.status, clientId: 'none' }),
      'MCP connector request refused',
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain('nope');
    warn.mockRestore();
  });

  it('connects a client that registered with a secret, and refuses its token request without it', async () => {
    const registered = await request(app)
      .post('/register')
      .send({
        client_name: 'Claude',
        redirect_uris: [REDIRECT],
        token_endpoint_auth_method: 'client_secret_post',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
      });
    expect(registered.status).toBe(201);
    expect(registered.body.token_endpoint_auth_method).toBe('client_secret_post');
    const { client_id: clientId, client_secret: clientSecret } = registered.body as {
      client_id: string;
      client_secret: string;
    };
    expect(clientSecret).toHaveLength(64);
    const stored = await runAsPlatform(() => McpClientModel.findOne({ clientId }).lean());
    expect(stored?.clientSecret).not.toBe(clientSecret);
    expect(JSON.stringify(stored?.metadata)).not.toContain(clientSecret);

    const { verifier, challenge } = pkce();
    const code = async () => {
      const authorize = await request(app).get('/authorize').query({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: REDIRECT,
        code_challenge: challenge,
        code_challenge_method: 'S256',
      });
      const id = new URL(authorize.headers.location).searchParams.get('request') ?? '';
      return new URL(await approveAuthorization(ctx, id)).searchParams.get('code');
    };
    const trade = async (secret?: string) =>
      request(app)
        .post('/token')
        .type('form')
        .send({
          grant_type: 'authorization_code',
          code: await code(),
          code_verifier: verifier,
          client_id: clientId,
          redirect_uri: REDIRECT,
          ...(secret ? { client_secret: secret } : {}),
        });
    expect((await trade()).status).toBe(400);
    const ok = await trade(clientSecret);
    expect(ok.status).toBe(200);
    expect(ok.body.access_token).toEqual(expect.any(String));
  });

  it('refuses a code used twice, or by another client', async () => {
    const clientId = await register();
    const other = await register();
    const { verifier, challenge } = pkce();
    const authorize = await request(app).get('/authorize').query({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: REDIRECT,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    const id = new URL(authorize.headers.location).searchParams.get('request') ?? '';
    const code = new URL(await approveAuthorization(ctx, id)).searchParams.get('code');
    const trade = (client: string) =>
      request(app).post('/token').type('form').send({
        grant_type: 'authorization_code',
        code,
        code_verifier: verifier,
        client_id: client,
        redirect_uri: REDIRECT,
      });
    expect((await trade(other)).status).toBe(400);
    expect((await trade(clientId)).status).toBe(400);
  });

  it('sends a declined sign-in back with access_denied, and only for CRM users', async () => {
    const clientId = await register();
    const { challenge } = pkce();
    const authorize = await request(app).get('/authorize').query({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: REDIRECT,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: 'st-2',
    });
    const id = new URL(authorize.headers.location).searchParams.get('request') ?? '';
    const outsider: GraphQLContext = {
      user: { id: user.id, email: user.email, roles: [ROLES.EMPLOYEE], organizationId },
      organizationId,
    };
    expect(await codeOf(describeAuthorization(outsider, id))).toBe('FORBIDDEN');
    // Nobody in any company has no CRM to connect Claude to.
    const nowhere: GraphQLContext = {
      user: { id: '0123456789abcdef01234567', email: 'x@x.com', roles: [ROLES.CRM] },
      organizationId: null,
    };
    expect(await codeOf(approveAuthorization(nowhere, id))).toBe('BAD_USER_INPUT');
    const back = new URL(await denyAuthorization(ctx, id));
    expect([back.searchParams.get('error'), back.searchParams.get('state')]).toEqual([
      'access_denied',
      'st-2',
    ]);
    expect(await codeOf(describeAuthorization(ctx, id))).toBe('NOT_FOUND');
    expect(await codeOf(describeAuthorization(ctx, 'not-an-id'))).toBe('NOT_FOUND');
  });

  it('binds a connection to the server it was added at, the CRM one also at /mcp/crm', async () => {
    const { tokens } = await connect('/mcp/crm');
    const init = await rpc(tokens.access_token, 'initialize', HELLO, '/mcp/crm');
    expect(init.body.result.serverInfo.name).toBe('exyconn-crm');
    const list = await rpc(tokens.access_token, 'tools/list', {}, '/mcp');
    expect(list.body.result.tools).toHaveLength(4);
    const marketing = await rpc(tokens.access_token, 'tools/list', {}, '/mcp/marketing');
    expect(marketing.status).toBe(403);
    expect(marketing.body.error.message).toMatch(/not for Marketing/);
    expect((await rpc(tokens.access_token, 'tools/list', {}, '/mcp/all')).status).toBe(403);
  });

  it('connects Marketing for a marketer, with its own tools and audit module', async () => {
    await UserModel.updateOne({ _id: user.id }, { roles: [ROLES.MARKETING] });
    const marketer: GraphQLContext = {
      ...ctx,
      user: { ...ctx.user!, roles: [ROLES.MARKETING] },
    };
    expect(await codeOf(connect('/mcp/crm', marketer))).toBe('FORBIDDEN');
    const { tokens } = await connect('/mcp/marketing', marketer);
    const init = await rpc(
      tokens.access_token,
      'initialize',
      {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'claude', version: '1' },
      },
      '/mcp/marketing',
    );
    expect(init.body.result.serverInfo.name).toBe('exyconn-marketing');
    const list = await rpc(tokens.access_token, 'tools/list', {}, '/mcp/marketing');
    expect(list.body.result.tools.map((tool: { name: string }) => tool.name)).toEqual([
      'campaignCount',
    ]);
    const called = await rpc(
      tokens.access_token,
      'tools/call',
      { name: 'campaignCount' },
      '/mcp/marketing',
    );
    expect(called.body.result.content[0].text).toBe('3');
    const row = await McpCallModel.findOne({ tool: 'campaignCount' }).lean();
    expect(row?.server).toBe('marketing');
    const audits = await runAsPlatform(() =>
      AuditLogModel.find({ module: 'Marketing (Claude MCP)' }).lean(),
    );
    expect(audits.map((entry) => entry.action)).toEqual(['LOGIN']);

    await UserModel.updateOne({ _id: user.id }, { roles: [ROLES.EMPLOYEE] });
    const lost = await rpc(tokens.access_token, 'tools/list', {}, '/mcp/marketing');
    expect(lost.status).toBe(403);
    expect(lost.body.error.message).toMatch(/do not have access to Marketing/);
  });

  it('offers every tool the person may use at the global address', async () => {
    await UserModel.updateOne({ _id: user.id }, { roles: [ROLES.ADMIN] });
    const admin: GraphQLContext = { ...ctx, user: { ...ctx.user!, roles: [ROLES.ADMIN] } };
    const { tokens } = await connect('/mcp/all', admin);
    const init = await rpc(tokens.access_token, 'initialize', HELLO, '/mcp/all');
    expect(init.body.result.serverInfo.name).toBe('exyconn');
    const list = await rpc(tokens.access_token, 'tools/list', {}, '/mcp/all');
    expect(list.body.result.tools.map((tool: { name: string }) => tool.name)).toEqual([
      'campaignCount',
      'crmBig',
      'crmPing',
      'deleteThing',
      'failing',
    ]);
    const called = await rpc(
      tokens.access_token,
      'tools/call',
      { name: 'campaignCount' },
      '/mcp/all',
    );
    expect(called.body.result.content[0].text).toBe('3');
    const missing = await rpc(tokens.access_token, 'tools/call', { name: 'none' }, '/mcp/all');
    expect(missing.body.result.content[0].text).toBe(
      'There is no All Exyconn tools tool named none.',
    );
  });

  it('refuses a sign-in for an address that is no Exyconn server', async () => {
    const clientId = await register();
    const { challenge } = pkce();
    const authorize = await request(app).get('/authorize').query({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: REDIRECT,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      resource: 'https://portal-server.exyconn.com/mcp/nothing',
    });
    expect(authorize.status).toBe(302);
    expect(new URL(authorize.headers.location).searchParams.get('error')).toBe('invalid_target');
  });
});
