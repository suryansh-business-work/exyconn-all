import { Kind, type DocumentNode } from 'graphql';
import * as websiteChat from '../../../../src/modules/website-chat';

/** The fields a typeDefs document adds to `extend type <name>`. */
function extendedFields(doc: DocumentNode, name: 'Query' | 'Mutation'): string[] {
  return doc.definitions.flatMap((definition) =>
    definition.kind === Kind.OBJECT_TYPE_EXTENSION && definition.name.value === name
      ? (definition.fields ?? []).map((field) => field.name.value)
      : [],
  );
}

describe('website chat module', () => {
  it('exposes the socket, the handoff job and the Slack events route', () => {
    expect(websiteChat.CHAT_SOCKET_PATH).toBe('/chat/ws');
    expect(websiteChat.SLACK_EVENTS_PATH).toBe('/slack/events');
    expect(typeof websiteChat.attachChatSocket).toBe('function');
    expect(typeof websiteChat.startChatHandoff).toBe('function');
    expect(typeof websiteChat.slackEventsRouter).toBe('function');
  });

  it.each(['Query', 'Mutation'] as const)('resolves every %s field its schema declares', (name) => {
    const resolvers = {
      ...websiteChat.websiteChatResolvers[name],
      ...websiteChat.websiteChatLibraryResolvers[name],
    };
    const declared = [
      ...extendedFields(websiteChat.websiteChatTypeDefs, name),
      ...extendedFields(websiteChat.websiteChatLibraryTypeDefs, name),
    ];
    expect(declared.length).toBeGreaterThan(0);
    expect(declared.filter((field) => !(field in resolvers))).toEqual([]);
  });
});
