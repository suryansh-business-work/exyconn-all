import { Kind, type DefinitionNode, type FieldDefinitionNode } from 'graphql';
import * as tech from '../../../../src/modules/tech';
import { techSecretResolvers } from '../../../../src/modules/tech/tech.secrets';

/** The fields a type (or `extend type`) declares in the module's schema. */
function fieldsOf(typeName: string): string[] {
  const isType = (node: DefinitionNode) =>
    (node.kind === Kind.OBJECT_TYPE_DEFINITION || node.kind === Kind.OBJECT_TYPE_EXTENSION) &&
    node.name.value === typeName;
  const node = tech.techTypeDefs.definitions.find(isType) as
    { fields?: readonly FieldDefinitionNode[] } | undefined;
  return (node?.fields ?? []).map((field) => field.name.value);
}

const RAW_SECRETS = new Set([
  'password',
  'privateKey',
  'botToken',
  'signingSecret',
  'token',
  'apiKey',
]);

describe('the Tech schema', () => {
  it('has a resolver for every query and mutation it declares, and declares every one it resolves', () => {
    expect(new Set(fieldsOf('Query'))).toEqual(new Set(Object.keys(tech.techResolvers.Query)));
    expect(new Set(fieldsOf('Mutation'))).toEqual(
      new Set(Object.keys(tech.techResolvers.Mutation)),
    );
  });

  it.each([
    'EmailConfig',
    'InboundMailConfig',
    'ImageConfig',
    'SlackConfig',
    'GithubConfig',
    'PexelsConfig',
    'OpenAiConfig',
  ])('never exposes a stored credential on %s', (typeName) => {
    const fields = fieldsOf(typeName);

    expect(fields).toContain('id');
    expect(fields.filter((field) => RAW_SECRETS.has(field))).toEqual([]);
  });

  it('declares every secret field the resolvers answer, on the type that owns it', () => {
    // SonarConfig is declared by the security module's schema, not this one.
    const { SonarConfig, ...declaredHere } = techSecretResolvers;
    expect(Object.keys(SonarConfig)).toEqual(['hasToken', 'tokenHint']);
    for (const [typeName, resolvers] of Object.entries(declaredHere)) {
      expect(tech.techResolvers).toHaveProperty(typeName, resolvers);
      expect(fieldsOf(typeName)).toEqual(expect.arrayContaining(Object.keys(resolvers)));
    }
  });
});
