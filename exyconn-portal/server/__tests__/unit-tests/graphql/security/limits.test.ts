import { buildSchema, parse, specifiedRules, validate } from 'graphql';
import { GRAPHQL_LIMITS, graphqlArmor } from '../../../../src/graphql/security/limits';

const schema = buildSchema(`
  type Node { child: Node name: String }
  type Query { node: Node hello: String }
`);

const errorsFor = (source: string) => {
  const rules = [...specifiedRules, ...graphqlArmor().validationRules];
  return validate(schema, parse(source), rules);
};

describe('GRAPHQL_LIMITS', () => {
  it('cannot be changed at runtime', () => {
    expect(Object.isFrozen(GRAPHQL_LIMITS)).toBe(true);
    expect(GRAPHQL_LIMITS).toEqual({
      maxDepth: 14,
      maxAliases: 10,
      maxDirectives: 10,
      maxCost: 2000,
      maxTokens: 1000,
    });
  });
});

describe('graphqlArmor', () => {
  it('hands Apollo its plugins and validation rules', () => {
    const armor = graphqlArmor();
    expect(Array.isArray(armor.plugins)).toBe(true);
    expect(armor.plugins.length).toBeGreaterThan(0);
    expect(armor.validationRules.length).toBeGreaterThan(0);
  });

  it('accepts an ordinary query', () => {
    expect(errorsFor('{ hello node { name child { name } } }')).toEqual([]);
  });

  it('refuses a document nested past the depth limit without naming the limit', () => {
    const depth = GRAPHQL_LIMITS.maxDepth + 2;
    const source = `{ node { ${'child { '.repeat(depth)}name${' }'.repeat(depth)} } }`;
    expect(validate(schema, parse(source), specifiedRules)).toEqual([]);
    const errors = errorsFor(source);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.map((error) => error.message).join(' ')).not.toContain(
      String(GRAPHQL_LIMITS.maxDepth),
    );
  });

  it('refuses an alias flood', () => {
    const aliases = Array.from(
      { length: GRAPHQL_LIMITS.maxAliases + 1 },
      (_, index) => `a${index}: hello`,
    ).join(' ');
    expect(errorsFor(`{ ${aliases} }`).length).toBeGreaterThan(0);
  });
});
