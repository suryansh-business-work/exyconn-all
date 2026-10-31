import { buildASTSchema, concatAST, parse, validate } from 'graphql';
import { typeDefs } from '../../../../src/graphql';
import { AGENTS_MCP, MCP_ENDPOINT_PATHS, MCP_SERVERS } from '../../../../src/modules/mcp/servers';
import { declaredFields, moduleTools } from '../../../../src/modules/mcp/core/mcp.tools';
import { ROLES } from '../../../../src/constants/roles';

const schema = buildASTSchema(concatAST(typeDefs.flat()), { assumeValidSDL: true });
const tools = moduleTools(schema, declaredFields(AGENTS_MCP.typeDefs), AGENTS_MCP.label);
const names = new Set(tools.map((tool) => tool.name));

describe('the Agents MCP server', () => {
  it('is registered at /mcp/agents for the AGENTS role', () => {
    expect(MCP_SERVERS.map((spec) => spec.key)).toContain('agents');
    expect(MCP_ENDPOINT_PATHS.agents).toBe('/mcp/agents');
    expect(AGENTS_MCP).toMatchObject({
      name: 'exyconn-agents',
      label: 'Agents',
      role: ROLES.AGENTS,
    });
  });

  it('offers the overview, the bot studio, the calling bot, the website chat and the leads', () => {
    for (const name of [
      'agentsOverview',
      'whatsappDemos',
      'callingBotRecentCalls',
      'websiteChatSessionsPaged',
      'listWebsiteChatFaqs',
      'whatsappDemoVisitorsPaged',
    ]) {
      expect(names.has(name)).toBe(true);
    }
  });

  it('describes the overview tool and its days argument from the typeDefs', () => {
    const overview = tools.find((tool) => tool.name === 'agentsOverview');
    expect(overview?.description).toMatch(/^Reads the Agents console's overview/);
    expect(JSON.stringify(overview?.inputSchema)).toContain('1 to 365');
  });

  it('never offers the WhatsApp channel, whose settings hold the Meta access token', () => {
    expect(tools.filter((tool) => /WhatsappChannel/i.test(tool.name))).toEqual([]);
  });

  it('runs operations the schema accepts, every one of them', () => {
    const invalid = tools
      .map((tool) => ({ name: tool.name, errors: validate(schema, parse(tool.document)) }))
      .filter((result) => result.errors.length > 0);
    expect(invalid).toEqual([]);
  });
});
