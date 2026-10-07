/**
 * The events the deep walk in `deep-explore.ts` tries after each engine turn: every option
 * shown, every reminder delivered, several answers to each input, and each AI intent with
 * and without entities (or a failed read).
 */
import type { ChatEvent } from '../../../src/engine/engine';
import { MENU } from '../../../src/engine/menu';
import type { DemoBundle } from '../../../src/engine/types';
import type { BotContent, EngineResult, RenderedOption } from '../../../src/messages';
import type { EntityKind, InputKind, WaNode } from '../../../src/schema';
import { NOW } from '../engine/fixtures';

const DAY = 24 * 60 * 60 * 1000;

const ANSWERS: Readonly<Record<InputKind, readonly string[]>> = {
  name: ['Asha Rao'],
  phone: ['98765 43210'],
  email: ['asha@example.com'],
  date: ['14/08/1990', '01/06/2022'],
  pincode: ['411045'],
  number: ['3', '200', '32000', '5000000'],
  text: ['Some detail about it'],
};

const TIMED_KINDS: ReadonlySet<EntityKind> = new Set(['date', 'time', 'datetime']);

const ENTITY_VALUES: Readonly<Record<EntityKind, readonly string[]>> = {
  name: ['Asha Rao'],
  phone: ['+91 98765 43210'],
  email: ['asha@example.com'],
  date: [String(NOW + DAY)],
  time: ['17:00'],
  datetime: [String(NOW + DAY + 8 * 60 * 60 * 1000)],
  location: ['Baner, Pune'],
  number: ['3', '200'],
  text: ['left side'],
};

export function optionsOf(content: BotContent): RenderedOption[] {
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

export function nodeOf(bundle: DemoBundle, workflow: string, id: string): WaNode | undefined {
  return bundle.workflows.find((w) => w.key === workflow)?.graph.nodes.find((n) => n.id === id);
}

function aiEvents(workflow: string, node: Extract<WaNode, { type: 'ai' }>): [string, ChatEvent][] {
  const request = { workflow, node: node.id, text: 'free text', intents: [], entities: [] };
  const events: [string, ChatEvent][] = [
    [`ai:${workflow}:${node.id}:failed`, { type: 'ai', request, result: null }],
  ];
  for (const intent of [...node.data.intents.map((i) => i.id), null]) {
    for (const pick of [0, 1]) {
      const entities = Object.fromEntries(
        node.data.entities.flatMap((e) => {
          const values = ENTITY_VALUES[e.kind];
          const value: [string, string] = [e.name, values[Math.min(pick, values.length - 1)]];
          // The server's reader adds `<name>Ms` beside every date, time and datetime it reads.
          return TIMED_KINDS.has(e.kind) ? [value, [`${e.name}Ms`, String(NOW + DAY)]] : [value];
        }),
      );
      events.push([
        `ai:${workflow}:${node.id}:${intent}:${pick}`,
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

export function nextEvents(
  bundle: DemoBundle,
  result: EngineResult,
  followMenu: boolean,
): [string, ChatEvent][] {
  const events: [string, ChatEvent][] = [];
  for (const reply of result.replies) {
    for (const option of optionsOf(reply.message.content as BotContent)) {
      const { workflow, node, handle } = option.ref;
      if (workflow !== MENU) {
        events.push([
          `choice:${workflow}:${node}:${handle}`,
          { type: 'choice', option, quoted: 'q' },
        ]);
      } else if (followMenu) {
        events.push([`menu:${handle}`, { type: 'choice', option, quoted: 'q' }]);
      }
    }
  }
  for (const push of result.scheduled) {
    events.push([`push:${push.workflow}:${push.node}`, { type: 'push', push }]);
  }
  const awaiting = result.state.awaiting;
  const node = awaiting && nodeOf(bundle, awaiting.workflow, awaiting.node);
  if (awaiting && node?.type === 'input') {
    for (const text of ANSWERS[node.data.kind]) {
      events.push([`input:${awaiting.workflow}:${node.id}:${text}`, { type: 'text', text }]);
    }
  }
  if (awaiting && node?.type === 'ai') {
    events.push(...aiEvents(awaiting.workflow, node));
  }
  return events;
}
