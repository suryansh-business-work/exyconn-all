import { Kind, type DefinitionNode, type ObjectTypeExtensionNode } from 'graphql';
import * as tracker from '../../../../src/modules/tracker';
import { trackerMessageService } from '../../../../src/modules/tracker/tracker.message.service';
import { TrackerAccessModel } from '../../../../src/modules/tracker/models';

type RootType = 'Query' | 'Mutation';

/** Whether a definition is `extend type <root>`, the way every module adds its root fields. */
function extendsRoot(
  definition: DefinitionNode,
  root: RootType,
): definition is ObjectTypeExtensionNode {
  return definition.kind === Kind.OBJECT_TYPE_EXTENSION && definition.name.value === root;
}

/** The root fields the tracker schema adds to one root type. */
function schemaFields(root: RootType): string[] {
  return tracker.trackerTypeDefs.definitions
    .filter((definition): definition is ObjectTypeExtensionNode => extendsRoot(definition, root))
    .flatMap((definition) => (definition.fields ?? []).map((field) => field.name.value))
    .sort((a, b) => a.localeCompare(b));
}

const resolverFields = (resolvers: object): string[] =>
  Object.keys(resolvers).sort((a, b) => a.localeCompare(b));

describe('the tracker module', () => {
  it('declares a schema field for every resolver, and a resolver for every field', () => {
    expect(schemaFields('Query')).toEqual(resolverFields(tracker.trackerResolvers.Query));
    expect(schemaFields('Mutation')).toEqual(resolverFields(tracker.trackerResolvers.Mutation));
  });

  it('exposes what the rest of the server reaches in for', () => {
    expect(tracker.trackerMessageService).toBe(trackerMessageService);
    expect(tracker.TrackerAccessModel).toBe(TrackerAccessModel);
    expect(tracker.isAwayPresence('LUNCH')).toBe(true);
    expect(tracker.presenceOf({}).status).toBe('WORKING');
    expect(typeof tracker.setPresence).toBe('function');
    expect(typeof tracker.startTrackerRetention).toBe('function');
    expect(typeof tracker.startTrackerDigest).toBe('function');
  });
});
