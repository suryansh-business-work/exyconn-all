import { describe, expect, it } from 'vitest';
import * as engineEntry from '../../../src/engine';
import { createDummy, hashSeed, startOfDay } from '../../../src/engine/dummy';
import { newChatState, respond } from '../../../src/engine/engine';
import { DEFAULT_INPUT_ERRORS, parseInput } from '../../../src/engine/inputs';
import { isMenuWord, matchKeywords, MENU, menuMessage, normalise } from '../../../src/engine/menu';
import { renderNode } from '../../../src/engine/render';
import { amountOf, evaluate, evaluateAll, fill, say, scopeOf } from '../../../src/engine/template';
import { makeBundle, makeCtx, makeWorkflow } from './fixtures';

describe('@exyconn/wa-flow/engine entry', () => {
  it('re-exports the engine, dummy data, templates, inputs, menu and renderer', () => {
    expect(engineEntry).toMatchObject({
      respond,
      newChatState,
      createDummy,
      hashSeed,
      startOfDay,
      fill,
      say,
      scopeOf,
      evaluate,
      evaluateAll,
      amountOf,
      parseInput,
      DEFAULT_INPUT_ERRORS,
      MENU,
      menuMessage,
      matchKeywords,
      isMenuWord,
      normalise,
      renderNode,
    });
  });

  it('plays a chat end to end through the entry alone', () => {
    const bundle = makeBundle([
      makeWorkflow(
        'hello',
        [
          { id: 'hi', type: 'text', data: { text: 'Hello {{user.firstName}}' }, next: 'bye' },
          { id: 'bye', type: 'end', data: { showMenu: false } },
        ],
        { keywords: ['hello there'] },
      ),
    ]);
    const ctx = makeCtx();
    const started = engineEntry.respond(
      bundle,
      engineEntry.newChatState('demo', 'viewer'),
      { type: 'start' },
      ctx,
    );
    expect(started.replies.map((r) => r.message.content.type)).toEqual(['text', 'list']);
    const result = engineEntry.respond(
      bundle,
      started.state,
      { type: 'text', text: 'hello there' },
      ctx,
    );
    expect(result.replies.map((r) => r.message.content)).toEqual([
      { type: 'text', text: 'Hello Asha' },
    ]);
    expect(result.state.completed).toBe(true);
  });
});
