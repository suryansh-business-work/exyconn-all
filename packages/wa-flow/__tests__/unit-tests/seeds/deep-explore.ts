/**
 * A stricter walk than `harness.ts`, for industries whose routing depends on what was said
 * earlier: a transition is taken again whenever a Condition case in its workflow would route
 * differently, every input gets several answers, every AI intent is tried, the menu can be
 * followed into the next workflow, and the chat is replayed under several seeds (so `$pick:`
 * and `$int:` values vary) and viewer profiles.
 */
import { respond, newChatState, type ChatEvent } from '../../../src/engine/engine';
import { MENU } from '../../../src/engine/menu';
import type { DemoBundle, DemoUser } from '../../../src/engine/types';
import type { BotContent, ChatState, EngineResult } from '../../../src/messages';
import type { WaNode } from '../../../src/schema';
import { makeCtx } from '../engine/fixtures';
import { nextEvents, nodeOf, optionsOf } from './deep-explore-events';

const MAX_EVENTS = 60_000;
/** What the engine says when an option points at something that no longer exists. */
const MISSING = 'That option is no longer available. Here is the menu again.';

export interface WalkOptions {
  /** Chat seeds to replay under; each gives other `$pick:` and `$int:` values. */
  seeds: readonly string[];
  /** Also take the menu after a workflow ends, so its answers reach the next one. */
  followMenu: boolean;
}

export interface DeepWalk {
  /** `workflow:node` of every node the chat stopped at or offered an option from. */
  reached: Set<string>;
  completed: Set<string>;
  missingReplies: number;
  events: number;
}

type Case = Extract<WaNode, { type: 'condition' }>['data']['cases'][number];

/** Per workflow, every case its Condition nodes test. */
function conditionCases(bundle: DemoBundle): Map<string, Case[]> {
  return new Map(
    bundle.workflows.map((w) => [
      w.key,
      w.graph.nodes.flatMap((n) => (n.type === 'condition' ? n.data.cases : [])),
    ]),
  );
}

/** Whether a case holds for these variables, compared as the engine compares them. */
function holds(c: Case, vars: Readonly<Record<string, string>>): boolean {
  const actual = (vars[c.var] ?? '').trim().toLowerCase();
  const expected = (c.value ?? '').trim().toLowerCase();
  const outcomes: Readonly<Record<Case['op'], () => boolean>> = {
    eq: () => actual === expected,
    neq: () => actual !== expected,
    contains: () => actual.includes(expected),
    empty: () => actual === '',
    notEmpty: () => actual !== '',
    gt: () => Number(actual) > Number(expected),
    lt: () => Number(actual) < Number(expected),
  };
  return outcomes[c.op]();
}

function record(bundle: DemoBundle, result: EngineResult, walk: DeepWalk): void {
  for (const signal of result.signals) {
    if (signal.type === 'FLOW_COMPLETED') {
      walk.completed.add(signal.workflow);
    }
  }
  for (const reply of result.replies) {
    const content = reply.message.content as BotContent;
    walk.missingReplies += content.type === 'text' && content.text === MISSING ? 1 : 0;
    for (const option of optionsOf(content)) {
      walk.reached.add(`${option.ref.workflow}:${option.ref.node}`);
    }
  }
  const awaiting = result.state.awaiting;
  if (awaiting && nodeOf(bundle, awaiting.workflow, awaiting.node)) {
    walk.reached.add(`${awaiting.workflow}:${awaiting.node}`);
  }
}

function walkSeed(
  bundle: DemoBundle,
  seed: string,
  user: DemoUser,
  options: WalkOptions,
  walk: DeepWalk,
): void {
  const ctx = makeCtx({ user, typingScale: 0 });
  const watched = conditionCases(bundle);
  const taken = new Set<string>();
  const queue: [ChatState, ChatEvent][] = bundle.workflows.map((w) => [
    newChatState(bundle.demo.key, seed),
    {
      type: 'choice',
      option: { id: w.key, title: w.name, ref: { workflow: MENU, node: MENU, handle: w.key } },
      quoted: 'menu',
    },
  ]);
  while (queue.length > 0 && walk.events < MAX_EVENTS) {
    const [state, event] = queue.shift() as [ChatState, ChatEvent];
    const result = respond(bundle, state, event, ctx);
    walk.events += 1;
    record(bundle, result, walk);
    for (const [transition, next] of nextEvents(bundle, result, options.followMenu)) {
      const cases = watched.get(transition.split(':')[1]) ?? [];
      const key = `${transition}|${cases.map((c) => Number(holds(c, result.state.vars))).join('')}`;
      if (!taken.has(key)) {
        taken.add(key);
        queue.push([result.state, next]);
      }
    }
  }
}

/** Walks every workflow under each seed, as a full profile, one without a phone and one without an email. */
export function deepWalk(bundle: DemoBundle, options: WalkOptions): DeepWalk {
  const walk: DeepWalk = { reached: new Set(), completed: new Set(), missingReplies: 0, events: 0 };
  const full = makeCtx().user;
  for (const seed of options.seeds) {
    for (const user of [full, { ...full, phone: '' }, { ...full, email: '' }]) {
      walkSeed(bundle, seed, user, options, walk);
    }
  }
  return walk;
}

export { MAX_EVENTS };
