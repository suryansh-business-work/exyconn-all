import { onlyRootFields } from '../../../src/utils/graphqlRootFields';

const ALLOWED: ReadonlySet<string> = new Set(['me', 'heartbeat']);

describe('onlyRootFields', () => {
  it('allows operations that select only allowed root fields, in every operation', () => {
    expect(onlyRootFields('query { me { id } }', ALLOWED)).toBe(true);
    expect(onlyRootFields('query A { me { id } } mutation B { heartbeat }', ALLOWED)).toBe(true);
    expect(onlyRootFields('query { me { ...F } } fragment F on User { id }', ALLOWED)).toBe(true);
  });

  it('refuses any other root field, even beside allowed ones or in a second operation', () => {
    expect(onlyRootFields('query { users { id } }', ALLOWED)).toBe(false);
    expect(onlyRootFields('query { me { id } users { id } }', ALLOWED)).toBe(false);
    expect(onlyRootFields('query A { me { id } } query B { users { id } }', ALLOWED)).toBe(false);
  });

  it('refuses root fragments and inline fragments, which could hide any field', () => {
    expect(onlyRootFields('query { ...R } fragment R on Query { users { id } }', ALLOWED)).toBe(
      false,
    );
    expect(onlyRootFields('query { ... on Query { me { id } } }', ALLOWED)).toBe(false);
  });

  it('refuses a request with no readable document', () => {
    expect(onlyRootFields('query {', ALLOWED)).toBe(false);
    expect(onlyRootFields(undefined, ALLOWED)).toBe(false);
    expect(onlyRootFields([{ query: 'query { me { id } }' }], ALLOWED)).toBe(false);
  });
});
