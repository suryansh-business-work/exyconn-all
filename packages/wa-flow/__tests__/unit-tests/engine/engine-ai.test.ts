import { describe, expect, it } from 'vitest';
import { newChatState, respond } from '../../../src/engine/engine';
import type {
  AiRequest,
  AiResult,
  BotContent,
  ChatState,
  EngineResult,
} from '../../../src/messages';
import { makeBundle, makeCtx, makeWorkflow } from './fixtures';

const ctx = makeCtx({ ai: true });
const FALLBACK = "Sorry, I didn't catch that. Pick an option below, or type *menu* at any time.";
const MISSING = 'That option is no longer available. Here is the menu again.';
const intents = [{ id: 'book', description: 'Wants to book' }];
const entities = [{ name: 'when', kind: 'datetime' as const, description: 'When' }];
const triage = makeWorkflow('triage', [
  {
    id: 'ask',
    type: 'ai',
    data: { prompt: 'What happened?', intents, entities, retry: 'Say that again?' },
    next: { book: 'booked', fallback: 'ask' },
  },
  { id: 'booked', type: 'end', data: { text: 'Booking {{when}}', showMenu: false } },
  { id: 'quiet', type: 'ai', data: { intents, entities: [] } },
  { id: 'plain', type: 'text', data: { text: 'Plain' } },
]);
const bundle = makeBundle([triage]);
const texts = (r: EngineResult) =>
  r.replies
    .map((m) => m.message.content as BotContent)
    .flatMap((c) => (c.type === 'text' ? [c.text] : []));
const answer = (
  request: AiRequest,
  result: AiResult,
  state: ChatState = newChatState('demo', 'x'),
) => respond(bundle, state, { type: 'ai', request, result }, ctx);
const nodeRequest = (node: string, workflow = 'triage'): AiRequest => ({
  workflow,
  node,
  text: 'hi there',
  intents,
  entities,
});
const routerRequest: AiRequest = {
  workflow: '$router',
  node: '$router',
  text: 'help',
  intents: [],
  entities: [],
};

describe('respond — AI nodes', () => {
  it('hands awaited text at an AI node to the server', () => {
    const waiting: ChatState = {
      ...newChatState('demo', 'x'),
      awaiting: { workflow: 'triage', node: 'ask' },
    };
    const result = respond(bundle, waiting, { type: 'text', text: 'my tooth hurts' }, ctx);
    expect(result.ai).toEqual({
      workflow: 'triage',
      node: 'ask',
      text: 'my tooth hurts',
      intents,
      entities,
    });
    expect(result.replies).toEqual([]);
  });

  it('follows the intent the server read and stores its entities', () => {
    const result = answer(nodeRequest('ask'), {
      intent: 'book',
      entities: { when: 'tomorrow 5pm' },
    });
    expect(result.state.vars.when).toBe('tomorrow 5pm');
    expect(texts(result)).toEqual(['Booking tomorrow 5pm']);
    expect(result.signals[0]).toEqual({
      type: 'STEP',
      workflow: 'triage',
      node: 'ask',
      stepKind: 'text',
      label: 'ai:book',
    });
  });

  it('retries through the fallback for an unknown intent or a failed read', () => {
    const unknown = answer(nodeRequest('ask'), { intent: 'cancel', entities: {} });
    expect(texts(unknown)).toEqual(['Say that again?', 'What happened?']);
    expect(unknown.state.awaiting).toEqual({ workflow: 'triage', node: 'ask' });
    const failed = answer(nodeRequest('ask'), null);
    expect(failed.signals[0]).toMatchObject({ label: 'ai:fallback' });
    expect(texts(failed)[0]).toBe('Say that again?');
  });

  it('stops without a retry line when the node has none and nothing is wired', () => {
    const result = answer(nodeRequest('quiet'), { intent: null, entities: {} });
    expect(result.replies).toEqual([]);
    expect(result.state.awaiting).toBeUndefined();
  });

  it('shows the menu when the AI node or its workflow is gone', () => {
    expect(texts(answer(nodeRequest('plain'), null))).toEqual([MISSING]);
    expect(texts(answer(nodeRequest('ask', 'gone'), null))).toEqual([MISSING]);
  });
});

describe('respond — AI routing', () => {
  it('starts the workflow the router picked', () => {
    const result = answer(routerRequest, { intent: 'triage', entities: {} });
    expect(result.signals).toContainEqual({
      type: 'FLOW_STARTED',
      workflow: 'triage',
      node: 'ask',
    });
    expect(result.state.awaiting).toEqual({ workflow: 'triage', node: 'ask' });
  });

  it('apologises when the router found nothing usable', () => {
    expect(texts(answer(routerRequest, { intent: 'nope', entities: {} }))).toEqual([FALLBACK]);
    expect(texts(answer(routerRequest, { intent: null, entities: {} }))).toEqual([FALLBACK]);
    expect(texts(answer(routerRequest, null))).toEqual([FALLBACK]);
  });
});
