/**
 * Plays a seed demo the way customers would: every workflow from the menu, every option
 * tapped, every input answered with a valid value, every AI intent (and a failed read)
 * answered, every reminder delivered — once per distinct transition, for a viewer with and
 * without a phone on their profile. Reports what the engine reached.
 */
import { toDemoProfile, toWorkflowDef, type SeedDemo } from '../../../src/author';
import { waitsForCustomer } from '../../../src/handles';
import { respond, newChatState, type ChatEvent } from '../../../src/engine/engine';
import { MENU } from '../../../src/engine/menu';
import type { DemoBundle } from '../../../src/engine/types';
import type { BotContent, ChatState, EngineResult, RenderedOption } from '../../../src/messages';
import type { WaNode } from '../../../src/schema';
import { makeCtx } from '../engine/fixtures';
import { ANSWERS, entityValues } from './answers';

const MISSING = 'That option is no longer available. Here is the menu again.';
const MAX_EVENTS = 4000;

export interface Exploration {
  started: Set<string>;
  completed: Set<string>;
  /** `workflow:node` of every option, input and AI node the customer was shown. */
  reached: Set<string>;
  missingReplies: number;
  events: number;
}

export function bundleOf(seed: SeedDemo): DemoBundle {
  return {
    demo: toDemoProfile(seed, 0),
    workflows: seed.workflows.map((w, i) => toWorkflowDef(w, i)),
  };
}

function optionsOf(content: BotContent): RenderedOption[] {
  switch (content.type) {
    case 'buttons':
      return content.buttons;
    case 'list':
      return content.sections.flatMap((s) => s.rows);
    case 'product':
      return content.option ? [content.option] : [];
    case 'carousel':
      return content.cards.flatMap((c) => (c.option ? [c.option] : []));
    case 'order':
      return content.pay ? [content.pay] : [];
    default:
      return [];
  }
}

function nodeOf(bundle: DemoBundle, workflow: string, id: string): WaNode | undefined {
  return bundle.workflows.find((w) => w.key === workflow)?.graph.nodes.find((n) => n.id === id);
}

/** Every next event worth trying after a result, keyed by the transition it takes. */
function nextEvents(bundle: DemoBundle, result: EngineResult): [string, ChatEvent][] {
  const events: [string, ChatEvent][] = [];
  for (const reply of result.replies) {
    for (const option of optionsOf(reply.message.content as BotContent)) {
      const { workflow, node, handle } = option.ref;
      if (workflow !== MENU) {
        events.push([
          `choice:${workflow}:${node}:${handle}`,
          { type: 'choice', option, quoted: 'q' },
        ]);
      }
    }
  }
  for (const push of result.scheduled) {
    events.push([`push:${push.workflow}:${push.node}`, { type: 'push', push }]);
  }
  const awaiting = result.state.awaiting;
  const node = awaiting && nodeOf(bundle, awaiting.workflow, awaiting.node);
  if (awaiting && node?.type === 'input') {
    events.push([
      `input:${awaiting.workflow}:${node.id}`,
      { type: 'text', text: ANSWERS[node.data.kind] },
    ]);
  }
  if (awaiting && node?.type === 'ai') {
    events.push(...aiEvents(awaiting.workflow, node));
  }
  return events;
}

/** A failed read, then each intent (and none) with low, high and no entity values. */
function aiEvents(workflow: string, node: Extract<WaNode, { type: 'ai' }>): [string, ChatEvent][] {
  const request = { workflow, node: node.id, text: 'free text', intents: [], entities: [] };
  const events: [string, ChatEvent][] = [
    [`ai:${workflow}:${node.id}:failed`, { type: 'ai', request, result: null }],
  ];
  for (const intent of [...node.data.intents.map((i) => i.id), null]) {
    for (const high of [false, true]) {
      const entities = Object.fromEntries(
        node.data.entities.flatMap((e) => entityValues(e.name, e.kind, high)),
      );
      events.push([
        `ai:${workflow}:${node.id}:${intent}:${high}`,
        { type: 'ai', request, result: { intent, entities } },
      ]);
    }
    events.push([
      `ai:${workflow}:${node.id}:${intent}:none`,
      { type: 'ai', request, result: { intent, entities: {} } },
    ]);
  }
  return events;
}

function record(bundle: DemoBundle, result: EngineResult, seen: Exploration): void {
  for (const signal of result.signals) {
    if (signal.type === 'FLOW_STARTED') {
      seen.started.add(signal.workflow);
    } else if (signal.type === 'FLOW_COMPLETED') {
      seen.completed.add(signal.workflow);
    }
  }
  for (const reply of result.replies) {
    const content = reply.message.content as BotContent;
    seen.missingReplies += content.type === 'text' && content.text === MISSING ? 1 : 0;
    for (const option of optionsOf(content)) {
      seen.reached.add(`${option.ref.workflow}:${option.ref.node}`);
    }
  }
  if (
    result.state.awaiting &&
    nodeOf(bundle, result.state.awaiting.workflow, result.state.awaiting.node)
  ) {
    seen.reached.add(`${result.state.awaiting.workflow}:${result.state.awaiting.node}`);
  }
}

function exploreAs(bundle: DemoBundle, phone: string, seen: Exploration): void {
  const ctx = makeCtx({ user: { ...makeCtx().user, phone }, typingScale: 0 });
  const taken = new Set<string>();
  const queue: [ChatState, ChatEvent][] = bundle.workflows.map((w) => [
    newChatState(bundle.demo.key, phone),
    {
      type: 'choice',
      option: { id: w.key, title: w.name, ref: { workflow: MENU, node: MENU, handle: w.key } },
      quoted: 'menu',
    },
  ]);
  while (queue.length > 0 && seen.events < MAX_EVENTS) {
    const [state, event] = queue.shift() as [ChatState, ChatEvent];
    const result = respond(bundle, state, event, ctx);
    seen.events += 1;
    record(bundle, result, seen);
    for (const [key, next] of nextEvents(bundle, result)) {
      if (!taken.has(key)) {
        taken.add(key);
        queue.push([result.state, next]);
      }
    }
  }
}

export function explore(bundle: DemoBundle): Exploration {
  const seen: Exploration = {
    started: new Set(),
    completed: new Set(),
    reached: new Set(),
    missingReplies: 0,
    events: 0,
  };
  exploreAs(bundle, '+91 98765 43210', seen);
  exploreAs(bundle, '', seen);
  return seen;
}

/** `workflow:node` of every node that stops for the customer. */
export function waitingNodes(bundle: DemoBundle): string[] {
  return bundle.workflows.flatMap((w) =>
    w.graph.nodes.filter((n) => waitsForCustomer(n)).map((n) => `${w.key}:${n.id}`),
  );
}
