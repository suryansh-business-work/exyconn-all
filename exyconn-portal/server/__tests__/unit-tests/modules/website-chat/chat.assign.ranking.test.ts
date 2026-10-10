import { freestAgent, type ChatAgentLoad } from '../../../../src/modules/website-chat/chat.assign';

const load = (id: string, fields: Partial<ChatAgentLoad> = {}): ChatAgentLoad => ({
  id,
  name: id,
  email: `${id}@exyconn.test`,
  online: true,
  openChats: 0,
  lastAssignedAt: null,
  ...fields,
});

describe('freestAgent tie-breaking on who was given a chat last', () => {
  const given = new Date('2026-10-01T00:00:00Z');

  it('prefers an agent who was never given a chat, whichever way round they are listed', () => {
    expect(freestAgent([load('given', { lastAssignedAt: given }), load('never')])?.id).toBe(
      'never',
    );
    expect(freestAgent([load('never'), load('given', { lastAssignedAt: given })])?.id).toBe(
      'never',
    );
  });

  it('keeps the listed order when nobody was ever given a chat', () => {
    expect(freestAgent([load('first'), load('second')])?.id).toBe('first');
  });
});
