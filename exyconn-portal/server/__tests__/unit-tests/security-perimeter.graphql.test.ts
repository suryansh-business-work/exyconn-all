import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import {
  Kind,
  Lexer,
  Source,
  TokenKind,
  buildASTSchema,
  concatAST,
  parse,
  specifiedRules,
  print,
  validate,
  visit,
  type ASTNode,
  type DocumentNode,
  type FragmentSpreadNode,
  type FragmentDefinitionNode,
  type OperationDefinitionNode,
} from 'graphql';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { typeDefs } from '../../src/graphql';
import { GRAPHQL_LIMITS, graphqlArmor } from '../../src/graphql/security/limits';

const REPO = join(__dirname, '../../../..');

/** Every client's operation folder: the portals, and the desktop and phone trackers. */
const CLIENT_OPERATIONS = [
  'packages/shell/src/graphql/operations',
  'packages/tracker-core/src/graphql/operations',
];

function graphqlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return graphqlFiles(path);
    }
    return path.endsWith('.graphql') ? [path] : [];
  });
}

/** The fragments an operation spreads, directly or through another fragment. */
function usedFragments(
  root: OperationDefinitionNode,
  fragments: ReadonlyMap<string, FragmentDefinitionNode>,
): FragmentDefinitionNode[] {
  const used = new Map<string, FragmentDefinitionNode>();
  const pending: ASTNode[] = [root];
  const collect = (spread: FragmentSpreadNode) => {
    const fragment = fragments.get(spread.name.value);
    if (fragment && !used.has(fragment.name.value)) {
      used.set(fragment.name.value, fragment);
      pending.push(fragment);
    }
  };
  while (pending.length > 0) {
    visit(pending.pop() as ASTNode, { FragmentSpread: collect });
  }
  return [...used.values()];
}

/** One document per operation with only the fragments it uses — what a client sends. */
function operationDocuments(dir: string): DocumentNode[] {
  const doc = parse(
    graphqlFiles(dir)
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n'),
  );
  const fragments = new Map<string, FragmentDefinitionNode>();
  const operations: OperationDefinitionNode[] = [];
  for (const definition of doc.definitions) {
    if (definition.kind === Kind.FRAGMENT_DEFINITION) {
      fragments.set(definition.name.value, definition);
    } else if (definition.kind === Kind.OPERATION_DEFINITION) {
      operations.push(definition);
    }
  }
  return operations.map((operation) => ({
    kind: Kind.DOCUMENT,
    definitions: [operation, ...usedFragments(operation, fragments)],
  }));
}

function tokenCount(text: string): number {
  const lexer = new Lexer(new Source(text));
  let count = 0;
  while (lexer.advance().kind !== TokenKind.EOF) {
    count += 1;
  }
  return count;
}

describe('GraphQL limits against the shipped clients', () => {
  const schema = buildASTSchema(concatAST(typeDefs));

  it.each(CLIENT_OPERATIONS)('accepts every operation in %s', (dir) => {
    const documents = operationDocuments(join(REPO, dir));
    expect(documents.length).toBeGreaterThan(0);
    const rules = [...specifiedRules, ...graphqlArmor().validationRules];
    for (const document of documents) {
      expect(validate(schema, document, rules).map((error) => error.message)).toEqual([]);
      expect(tokenCount(print(document))).toBeLessThanOrEqual(GRAPHQL_LIMITS.maxTokens);
    }
  });
});

describe('HTTP perimeter', () => {
  let app: Express;
  const post = (query: string) => request(app).post('/graphql').send({ query });

  beforeAll(async () => {
    app = await createApp();
  });

  it('sends the security headers and not the framework banner', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['strict-transport-security']).toContain('max-age=');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('refuses a document nested deeper than the limit', async () => {
    const depth = GRAPHQL_LIMITS.maxDepth + 5;
    const res = await post(`{ ${'a { '.repeat(depth)}b${' }'.repeat(depth)} }`);
    expect(res.body.errors[0].extensions.code).toBe('GRAPHQL_VALIDATION_FAILED');
    expect(res.body.data).toBeUndefined();
  });

  it('refuses an alias flood', async () => {
    const aliases = Array.from(
      { length: GRAPHQL_LIMITS.maxAliases + 1 },
      (_, index) => `b${index}: publicBranding { __typename }`,
    );
    const res = await post(`{ ${aliases.join(' ')} }`);
    expect(res.body.errors[0].extensions.code).toBe('GRAPHQL_VALIDATION_FAILED');
  });

  it('refuses a document over the token limit', async () => {
    const res = await post(`{ ${'__typename '.repeat(GRAPHQL_LIMITS.maxTokens + 1)}}`);
    expect(res.body.errors[0].extensions.code).toBe('GRAPHQL_VALIDATION_FAILED');
  });

  it('does not suggest field names', async () => {
    const res = await post('{ publicBrandin { id } }');
    expect(res.body.errors[0].message).not.toContain('publicBranding');
  });
});
