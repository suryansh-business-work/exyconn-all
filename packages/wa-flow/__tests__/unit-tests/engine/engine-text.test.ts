import { describe, expect, it } from 'vitest';
import { newChatState, respond } from '../../../src/engine/engine';
import type { BotContent, ChatState, EngineResult } from '../../../src/messages';
import { makeBundle, makeCtx, makeWorkflow } from './fixtures';

const ctx = makeCtx();
const FALLBACK = "Sorry, I didn't catch that. Pick an option below, or type *menu* at any time.";
const signup = makeWorkflow(
  'signup',
  [
    { id: 'hi', type: 'text', data: { text: 'Let us sign you up' }, next: 'name' },
    {
      id: 'name',
      type: 'input',
      data: { prompt: 'Name?', var: 'name', kind: 'name' },
      next: 'mail',
    },
    {
      id: 'mail',
      type: 'input',
      data: { prompt: 'Email?', var: 'email', kind: 'email', error: 'Bad email, {{name}}' },
      next: 'thanks',
    },
    { id: 'thanks', type: 'end', data: { text: 'Thanks {{name}} ({{email}})', showMenu: false } },
    { id: 'dangling', type: 'input', data: { var: 'x', kind: 'text' } },
  ],
  { keywords: ['sign up', 'register'] },
);
const bundle = makeBundle([signup]);
const texts = (r: EngineResult) =>
  r.replies
    .map((m) => m.message.content as BotContent)
    .flatMap((c) => (c.type === 'text' ? [c.text] : []));
const say = (state: ChatState, text: string, context = ctx) =>
  respond(bundle, state, { type: 'text', text }, context);

describe('respond — typed text', () => {
  it('starts a workflow by keyword and waits on its first input', () => {
    const result = say(newChatState('demo', 'x'), '  I want to Register  ');
    expect(result.sent).toMatchObject({
      from: 'user',
      content: { type: 'text', text: 'I want to Register' },
    });
    expect(texts(result)).toEqual(['Let us sign you up', 'Name?']);
    expect(result.state.awaiting).toEqual({ workflow: 'signup', node: 'name' });
  });

  it('stores a valid answer and moves on, re-asking with the node or default error', () => {
    const started = say(newChatState('demo', 'x'), 'sign up');
    const badName = say(started.state, '1234');
    expect(texts(badName)).toEqual(['Please type your full name using letters only.']);
    expect(badName.state.awaiting?.node).toBe('name');
    const named = say(started.state, 'Asha Rao');
    expect(named.state.vars.name).toBe('Asha Rao');
    expect(named.signals).toContainEqual({
      type: 'STEP',
      workflow: 'signup',
      node: 'name',
      stepKind: 'text',
      label: 'name',
    });
    expect(texts(named)).toEqual(['Email?']);
    expect(texts(say(named.state, 'not-an-email'))).toEqual(['Bad email, Asha Rao']);
    const done = say(named.state, 'ASHA@Example.com');
    expect(texts(done)).toEqual(['Thanks Asha Rao (asha@example.com)']);
    expect(done.state.completed).toBe(true);
  });

  it('stops quietly after an input with no outgoing edge', () => {
    const state: ChatState = {
      ...newChatState('demo', 'x'),
      awaiting: { workflow: 'signup', node: 'dangling' },
    };
    const result = say(state, 'some detail');
    expect(result.state.vars.x).toBe('some detail');
    expect(result.state.awaiting).toBeUndefined();
    expect(result.replies).toEqual([]);
  });

  it('brings the menu back on a menu word, abandoning the open workflow', () => {
    const started = say(newChatState('demo', 'x'), 'sign up');
    const result = say(started.state, 'Menu!');
    expect(result.signals).toEqual([{ type: 'FLOW_ABANDONED', workflow: 'signup', node: 'name' }]);
    expect(result.state.awaiting).toBeUndefined();
    expect(result.state.workflow).toBeUndefined();
    expect(result.replies.map((r) => r.message.content.type)).toEqual(['list']);
  });

  it('falls back to keywords when the awaited node is gone or does not take text', () => {
    const gone: ChatState = {
      ...newChatState('demo', 'x'),
      awaiting: { workflow: 'signup', node: 'ghost' },
    };
    expect(texts(say(gone, 'register'))).toEqual(['Let us sign you up', 'Name?']);
    const notInput: ChatState = {
      ...newChatState('demo', 'x'),
      awaiting: { workflow: 'signup', node: 'hi' },
    };
    expect(texts(say(notInput, 'gibberish'))).toEqual([FALLBACK]);
  });

  it('shows the menu with an apology for text it cannot place, without AI', () => {
    const result = say(newChatState('demo', 'x'), 'gibberish');
    expect(texts(result)).toEqual([FALLBACK]);
    expect(result.ai).toBeUndefined();
  });

  it('asks the server to route text it cannot place when AI is on', () => {
    const result = say(newChatState('demo', 'x'), 'gibberish', makeCtx({ ai: true }));
    expect(result.replies).toEqual([]);
    expect(result.ai).toEqual({
      workflow: '$router',
      node: '$router',
      text: 'gibberish',
      intents: [{ id: 'signup', description: 'signup name: signup description' }],
      entities: [],
    });
  });
});
