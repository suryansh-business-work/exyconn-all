import { describe, expect, it } from 'vitest';
import type { AuthorNode } from '../../../src/author';
import { newChatState, respond } from '../../../src/engine/engine';
import { MENU } from '../../../src/engine/menu';
import type { BotContent, ChatState, EngineResult, PendingPush } from '../../../src/messages';
import type { ConditionOp } from '../../../src/schema';
import { makeBundle, makeCtx, makeWorkflow, NOW } from './fixtures';

const ctx = makeCtx();
const texts = (r: EngineResult) =>
  r.replies
    .map((m) => m.message.content as BotContent)
    .flatMap((c) => (c.type === 'text' ? [c.text] : []));
const begin = (bundle: ReturnType<typeof makeBundle>, key: string, state?: ChatState) =>
  respond(
    bundle,
    state ?? newChatState('demo', 'x'),
    {
      type: 'choice',
      option: { id: key, title: key, ref: { workflow: MENU, node: MENU, handle: key } },
      quoted: 'Menu',
    },
    ctx,
  );

function conditionFlow(op: ConditionOp, value?: string): ReturnType<typeof makeBundle> {
  const nodes: AuthorNode[] = [
    {
      id: 'c',
      type: 'condition',
      data: { cases: [{ id: 'hit', var: 'v', op, value }] },
      next: { hit: 'yes', else: 'no' },
    },
    { id: 'yes', type: 'end', data: { text: 'hit', showMenu: false } },
    { id: 'no', type: 'end', data: { text: 'miss', showMenu: false } },
  ];
  return makeBundle([makeWorkflow('cond', nodes)]);
}
const outcome = (op: ConditionOp, actual: string | undefined, value?: string) => {
  const state = newChatState('demo', 'x');
  if (actual !== undefined) {
    state.vars.v = actual;
  }
  return texts(begin(conditionFlow(op, value), 'cond', state))[0];
};

describe('respond — conditions', () => {
  it('compares case- and space-insensitively', () => {
    expect(outcome('eq', ' Gold ', 'gold')).toBe('hit');
    expect(outcome('eq', 'silver', 'gold')).toBe('miss');
    expect(outcome('neq', 'silver', 'gold')).toBe('hit');
    expect(outcome('contains', 'Gold plan', 'gold')).toBe('hit');
  });

  it('checks emptiness, treating a missing variable as empty', () => {
    expect(outcome('empty', undefined)).toBe('hit');
    expect(outcome('empty', 'x')).toBe('miss');
    expect(outcome('notEmpty', 'x')).toBe('hit');
    expect(outcome('notEmpty', '  ')).toBe('miss');
  });

  it('compares numbers', () => {
    expect(outcome('gt', '10', '5')).toBe('hit');
    expect(outcome('gt', '5', '10')).toBe('miss');
    expect(outcome('lt', '5', '10')).toBe('hit');
    expect(outcome('lt', '5', undefined)).toBe('miss');
  });
});

describe('respond — logic nodes', () => {
  const reminders = makeBundle([
    makeWorkflow('remind', [
      {
        id: 'r',
        type: 'reminder',
        data: { afterMs: 60_000, label: 'Tomorrow' },
        next: { next: 'now', later: 'due' },
      },
      { id: 'now', type: 'reminder', data: { afterMs: 5_000 }, next: 'ok' },
      { id: 'ok', type: 'text', data: { text: 'Set' } },
      { id: 'due', type: 'end', data: { text: 'Your visit is due', showMenu: false } },
    ]),
  ]);

  it('schedules a push only for a reminder wired to "later"', () => {
    const result = begin(reminders, 'remind');
    expect(result.scheduled).toEqual([
      {
        id: expect.any(String),
        demoKey: 'demo',
        workflow: 'remind',
        node: 'due',
        at: NOW + 60_000,
        label: 'Tomorrow',
      },
    ]);
    expect(texts(result)).toEqual(['Set']);
  });

  it('delivers a push into its workflow, and ignores one for a removed workflow', () => {
    const push: PendingPush = { id: 'p', demoKey: 'demo', workflow: 'remind', node: 'due', at: 0 };
    const state: ChatState = { ...newChatState('demo', 'x'), workflow: 'other' };
    const result = respond(reminders, state, { type: 'push', push }, ctx);
    expect(result.signals).toEqual([
      { type: 'REMINDER_DELIVERED', workflow: 'remind', node: 'due' },
    ]);
    expect(texts(result)).toEqual(['Your visit is due']);
    expect(result.state.completed).toBeUndefined();
    const gone = respond(
      reminders,
      state,
      { type: 'push', push: { ...push, workflow: 'gone' } },
      ctx,
    );
    expect(gone.replies).toEqual([]);
    expect(gone.signals).toEqual([]);
  });

  it('jumps into another workflow, abandoning the first', () => {
    const bundle = makeBundle([
      makeWorkflow('a', [{ id: 'j', type: 'jump', data: { workflowKey: 'b' } }]),
      makeWorkflow('b', [{ id: 'b1', type: 'end', data: { text: 'In B', showMenu: true } }]),
    ]);
    const result = begin(bundle, 'a');
    expect(result.signals.map((s) => s.type)).toEqual([
      'STEP',
      'FLOW_STARTED',
      'FLOW_ABANDONED',
      'FLOW_STARTED',
      'FLOW_COMPLETED',
    ]);
    expect(texts(result)).toEqual(['In B']);
    expect(result.replies[result.replies.length - 1].message.content.type).toBe('list');
  });

  it('shows the menu when an edge points at a node that is gone', () => {
    const broken = makeWorkflow('broken', [
      { id: 'a', type: 'text', data: { text: 'A' }, next: 'ghost' },
    ]);
    const result = begin(makeBundle([broken]), 'broken');
    expect(texts(result)).toEqual([
      'A',
      'That option is no longer available. Here is the menu again.',
    ]);
  });

  it('stops a loop after 40 nodes', () => {
    const loop = makeWorkflow('loop', [
      { id: 'a', type: 'text', data: { text: 'A' }, next: 'b' },
      { id: 'b', type: 'text', data: { text: 'B' }, next: 'a' },
    ]);
    expect(begin(makeBundle([loop]), 'loop').replies).toHaveLength(40);
  });
});
