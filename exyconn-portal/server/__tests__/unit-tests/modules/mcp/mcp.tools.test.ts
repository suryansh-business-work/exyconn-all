import { buildASTSchema, buildSchema, concatAST, parse, validate } from 'graphql';
import gql from 'graphql-tag';
import { typeDefs } from '../../../../src/graphql';
import { CRM_MCP, MARKETING_MCP, MCP_SERVERS } from '../../../../src/modules/mcp/servers';
import {
  argumentsSchema,
  moduleTools,
  declaredFields,
  documentOf,
  inputSchemaOf,
  selectionOf,
} from '../../../../src/modules/mcp/core/mcp.tools';

const toy = buildSchema(`
  scalar DateTime
  scalar JSON
  scalar Money
  enum Stage { OPEN WON }
  input Filter { "the name" name: String!, stages: [Stage!], deep: Filter, at: DateTime, extra: JSON, cost: Money }
  type Owner { id: ID! name: String! deals(first: Int!): [Deal!]! }
  type Deal { name: String! id: ID! stage: Stage owner: Owner tags: [String!]! }
  type Note { id: ID! text: String! }
  union Item = Deal | Note
  type Query {
    "Finds deals."
    deals(filter: Filter, limit: Int = 10, page: Int!): [Deal!]!
    count: Int!
    items: [Item!]!
    dealConfigs: [Deal!]!
  }
  type Mutation { deleteDeal(id: ID!): Boolean! }
`);

describe('declared fields', () => {
  it('reads Query and Mutation fields from definitions and extensions, nothing else', () => {
    const declared = declaredFields([
      gql`
        type Query {
          a: Int
        }
        extend type Mutation {
          b: Int
        }
        type Deal {
          c: Int
        }
        input X {
          d: Int
        }
      `,
    ]);
    expect([...declared.query]).toEqual(['a']);
    expect([...declared.mutation]).toEqual(['b']);
  });
});

describe('input schemas', () => {
  it('turns arguments into JSON Schema, requiring only non-null ones without a default', () => {
    const field = toy.getQueryType()!.getFields().deals;
    const schema = argumentsSchema(field.args);
    expect(schema.required).toEqual(['page']);
    const filter = (schema.properties as Record<string, Record<string, unknown>>).filter;
    expect(filter).toMatchObject({
      type: 'object',
      required: ['name'],
      additionalProperties: false,
      properties: {
        name: { type: 'string', description: 'the name' },
        stages: { type: 'array', items: { type: 'string', enum: ['OPEN', 'WON'] } },
        at: { type: 'string', format: 'date-time' },
        extra: {},
        cost: { type: 'string', description: 'A Money value' },
      },
    });
  });

  it('stops spelling out a self-referencing input after a few levels', () => {
    const filter = toy.getType('Filter') as Parameters<typeof inputSchemaOf>[0];
    let level = inputSchemaOf(filter) as { properties?: { deep?: unknown } };
    for (let depth = 0; depth < 5; depth++) {
      level = level.properties?.deep as typeof level;
    }
    expect(level.properties?.deep).toEqual({ type: 'object' });
  });
});

describe('answers', () => {
  it('selects scalars and enums, nested objects two levels down, the id first', () => {
    const deals = toy.getQueryType()!.getFields().deals;
    expect(selectionOf(deals.type)).toBe('id name stage owner { id name } tags');
    expect(selectionOf(deals.type, 1)).toBe('id name stage tags');
  });

  it('reads a union member by member, and a scalar answer with no selection', () => {
    const query = toy.getQueryType()!.getFields();
    expect(selectionOf(query.items.type)).toBe(
      '__typename ... on Deal { id name stage owner { id name } tags } ... on Note { id text }',
    );
    expect(selectionOf(query.count.type)).toBe('');
  });

  it('writes an operation with a variable per argument', () => {
    const query = toy.getQueryType()!.getFields();
    expect(documentOf('QUERY', query.count)).toBe('query { count }');
    const mutation = toy.getMutationType()!.getFields();
    expect(documentOf('MUTATION', mutation.deleteDeal)).toBe(
      'mutation McpTool($id: ID!) { deleteDeal(id: $id) }',
    );
  });

  it('leaves configuration out, and describes each tool by its field, its shape or its kind', () => {
    const tools = moduleTools(
      toy,
      { query: new Set(['deals', 'count', 'dealConfigs']), mutation: new Set(['deleteDeal']) },
      'CRM',
    );
    expect(tools.map((tool) => [tool.name, tool.kind])).toEqual([
      ['count', 'QUERY'],
      ['deals', 'QUERY'],
      ['deleteDeal', 'MUTATION'],
    ]);
    expect(tools[1].description).toMatch(/^Finds deals\./);
    expect(tools[0].description).toMatch(/^Reads CRM data \(count\)/);
    expect(tools[2].description).toMatch(/^Deletes the deal with this id;/);
    expect(tools[1].args).toEqual([
      { name: 'filter', type: 'Filter', required: false, description: '' },
      { name: 'limit', type: 'Int', required: false, description: '' },
      { name: 'page', type: 'Int!', required: true, description: '' },
    ]);
  });
});

const schema = buildASTSchema(concatAST(typeDefs.flat()), { assumeValidSDL: true });

describe('the CRM tools', () => {
  const tools = moduleTools(schema, declaredFields(CRM_MCP.typeDefs), CRM_MCP.label);

  it('offers every CRM feature — records, mail, cold email, the lead generator — and no config', () => {
    const names = new Set(tools.map((tool) => tool.name));
    expect(tools.length).toBeGreaterThan(100);
    for (const name of ['searchLeads', 'leadLocationSuggestions']) {
      expect(names.has(name)).toBe(true);
    }
    expect(tools.filter((tool) => /Config|Secret|Token/.test(tool.name))).toEqual([]);
  });

  it('runs operations the schema accepts, every one of them', () => {
    const invalid = tools
      .map((tool) => ({ name: tool.name, errors: validate(schema, parse(tool.document)) }))
      .filter((result) => result.errors.length > 0)
      .map((result) => `${result.name}: ${result.errors[0].message}`);
    expect(invalid).toEqual([]);
  });
});

describe('the Marketing tools', () => {
  const tools = moduleTools(schema, declaredFields(MARKETING_MCP.typeDefs), MARKETING_MCP.label);

  it('offers campaigns, audiences, suppression and social media, and no config', () => {
    const names = new Set(tools.map((tool) => tool.name));
    for (const name of [
      'queueCampaignSend',
      'createAudienceList',
      'addMarketingSuppressions',
      'composeSocialMediaPost',
      'campaignMetrics',
    ]) {
      expect(names.has(name)).toBe(true);
    }
    expect(names.has('searchLeads')).toBe(false);
    expect(tools.filter((tool) => /Config|Secret|Token/.test(tool.name))).toEqual([]);
  });

  it('runs operations the schema accepts, every one of them', () => {
    const invalid = tools
      .map((tool) => ({ name: tool.name, errors: validate(schema, parse(tool.document)) }))
      .filter((result) => result.errors.length > 0)
      .map((result) => `${result.name}: ${result.errors[0].message}`);
    expect(invalid).toEqual([]);
  });
});

describe.each(MCP_SERVERS.map((spec) => [spec.label, spec] as const))(
  'the %s server',
  (_, spec) => {
    const tools = moduleTools(schema, declaredFields(spec.typeDefs), spec.label);

    it('offers tools, and never credentials, passwords, API keys or the Tech vault', () => {
      expect(tools.length).toBeGreaterThan(0);
      expect(
        tools.filter((tool) => /Config|Secret|Token|Password|ApiKey|Vault/.test(tool.name)),
      ).toEqual([]);
    });

    it('runs operations the schema accepts, every one of them', () => {
      const invalid = tools
        .map((tool) => ({ name: tool.name, errors: validate(schema, parse(tool.document)) }))
        .filter((result) => result.errors.length > 0)
        .map((result) => `${result.name}: ${result.errors[0].message}`);
      expect(invalid).toEqual([]);
    });
  },
);

describe('the module servers', () => {
  it('cover every portal, each at its own key', () => {
    expect(MCP_SERVERS.map((spec) => spec.key)).toEqual([
      'crm',
      'marketing',
      'admin',
      'ai',
      'clienthub',
      'compliance',
      'employee',
      'finance',
      'hr',
      'it',
      'legal',
      'products',
      'projects',
      'social',
      'status',
      'support',
      'tech',
      'tracker',
      'website',
    ]);
  });

  it('leave out the operations that hand back a password or an API key', () => {
    const offered = new Set(
      MCP_SERVERS.flatMap((spec) =>
        moduleTools(schema, declaredFields(spec.typeDefs), spec.label).map((tool) => tool.name),
      ),
    );
    const withheld = [
      'createApiKey',
      'listApiKeys',
      'resetUserPassword',
      'techProviderLoginPassword',
      'unlockTechVault',
    ];
    expect(withheld.filter((name) => offered.has(name))).toEqual([]);
    expect(offered.has('listUsers')).toBe(true);
  });
});
