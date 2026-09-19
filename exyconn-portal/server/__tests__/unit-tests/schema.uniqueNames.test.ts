import { Kind, type DocumentNode } from 'graphql';
import { typeDefs } from '../../src/graphql';

/**
 * Every module adds its own typeDefs, and the merge is silent: two modules declaring the same
 * type get one mixed type, and two declaring the same Query or Mutation field get one resolver
 * overwriting the other. Both happened once (the social feed's SocialPost and the marketing
 * SocialPost); this is the check that says so at test time instead.
 */
function duplicates(): string[] {
  const seen = new Map<string, number>();
  const note = (name: string) => seen.set(name, (seen.get(name) ?? 0) + 1);
  for (const doc of (typeDefs as unknown as DocumentNode[]).flat()) {
    for (const def of doc.definitions) {
      const isDefinition =
        def.kind === Kind.OBJECT_TYPE_DEFINITION ||
        def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION ||
        def.kind === Kind.ENUM_TYPE_DEFINITION ||
        def.kind === Kind.SCALAR_TYPE_DEFINITION ||
        def.kind === Kind.UNION_TYPE_DEFINITION ||
        def.kind === Kind.INTERFACE_TYPE_DEFINITION;
      const isRoot =
        (def.kind === Kind.OBJECT_TYPE_EXTENSION || def.kind === Kind.OBJECT_TYPE_DEFINITION) &&
        (def.name.value === 'Query' || def.name.value === 'Mutation');
      if (isRoot) {
        for (const field of def.fields ?? []) note(`${def.name.value}.${field.name.value}`);
      } else if (isDefinition) {
        note(def.name.value);
      }
    }
  }
  return [...seen].filter(([, count]) => count > 1).map(([name]) => name);
}

describe('GraphQL schema', () => {
  it('declares every type, and every query and mutation, exactly once', () => {
    expect(duplicates()).toEqual([]);
  });
});
