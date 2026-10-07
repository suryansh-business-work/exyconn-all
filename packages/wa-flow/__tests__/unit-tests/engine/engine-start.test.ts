import { describe, expect, it } from 'vitest';
import { hashSeed } from '../../../src/engine/dummy';
import { newChatState, respond } from '../../../src/engine/engine';
import { MENU } from '../../../src/engine/menu';
import type { ChatState } from '../../../src/messages';
import { makeBundle, makeCtx, makeWorkflow, NOW } from './fixtures';

const ctx = makeCtx();
const booking = makeWorkflow('book', [
  { id: 'hello', type: 'text', data: { text: 'Booking' }, next: 'bye' },
  { id: 'bye', type: 'end', data: { showMenu: false } },
]);
const bundle = makeBundle([booking]);
const fresh = (): ChatState => newChatState('demo', 'asha');

describe('newChatState', () => {
  it('starts empty with a seed from the demo and the viewer', () => {
    expect(newChatState('demo', 'asha')).toEqual({
      demoKey: 'demo',
      vars: {},
      seq: 0,
      seed: hashSeed('demo:asha'),
    });
  });
});

describe('respond — start', () => {
  it('greets the user and shows the menu, stamping ids and typing times', () => {
    const result = respond(bundle, fresh(), { type: 'start' }, ctx);
    const [greeting, menu] = result.replies;
    expect(greeting.message.content).toEqual({ type: 'text', text: 'Hi Asha' });
    expect(greeting.typingMs).toBe(400 + 'Hi Asha'.length * 14);
    expect(greeting.message.at).toBe(NOW + greeting.typingMs);
    expect(menu.typingMs).toBe(1100);
    expect(menu.message.content.type).toBe('list');
    expect(menu.message.id).toBe(`demo-${fresh().seed.toString(36)}-2`);
    expect(result.state.seq).toBe(2);
    expect(result.sent).toBeUndefined();
  });

  it('scales typing, and caps long texts', () => {
    const wordy = { ...bundle, demo: { ...bundle.demo, greeting: 'x'.repeat(300) } };
    const instant = respond(wordy, fresh(), { type: 'start' }, makeCtx({ typingScale: 0 }));
    expect(instant.replies.map((r) => r.typingMs)).toEqual([0, 0]);
    expect(respond(wordy, fresh(), { type: 'start' }, ctx).replies[0].typingMs).toBe(2200);
  });

  it('does not change the state it was given', () => {
    const state = fresh();
    const option = {
      id: 'book',
      title: 'Book',
      ref: { workflow: MENU, node: MENU, handle: 'book' },
    };
    respond(bundle, state, { type: 'choice', option, quoted: 'Menu' }, ctx);
    expect(state).toEqual(fresh());
  });
});
