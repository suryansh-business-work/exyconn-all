import { Kind, parse, type DocumentNode } from 'graphql';

/** The document a request carries, or null when it has none that parses. */
function parseDocument(query: unknown): DocumentNode | null {
  if (typeof query !== 'string') {
    return null;
  }
  try {
    return parse(query);
  } catch {
    return null;
  }
}

/**
 * Whether every operation in a GraphQL request selects only `allowed` root fields, named
 * directly (a fragment at the root could hide any field). A request with no readable
 * document — a batch, a persisted-query hash — is refused.
 *
 * The request-level fence for a narrow credential (a tracker device, the meeting extension):
 * whatever its holder's roles, it can only reach the operations its client actually calls.
 */
export function onlyRootFields(query: unknown, allowed: ReadonlySet<string>): boolean {
  const document = parseDocument(query);
  if (!document) {
    return false;
  }
  return document.definitions.every((definition) => {
    if (definition.kind !== Kind.OPERATION_DEFINITION) {
      return true;
    }
    return definition.selectionSet.selections.every(
      (selection) => selection.kind === Kind.FIELD && allowed.has(selection.name.value),
    );
  });
}
