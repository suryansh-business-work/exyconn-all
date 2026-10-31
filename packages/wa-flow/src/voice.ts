/**
 * Call flows: a calling bot's conversation drawn as a graph (Agents > Calling bot) with
 * the node types a phone call can carry, and turned into the step-by-step call script its
 * voice model follows. The voice agent speaks freely; the script keeps it on the path.
 */
import { outputHandles } from './handles';
import type { NodeType, WaGraph, WaNode } from './schema';

/** Nodes a voice call can carry: words, questions with spoken choices, answers, logic. */
export const VOICE_NODE_TYPES: readonly NodeType[] = [
  'text',
  'buttons',
  'list',
  'input',
  'ai',
  'condition',
  'handoff',
  'end',
];

const VOICE_TYPES: ReadonlySet<string> = new Set(VOICE_NODE_TYPES);

/** Nodes a call flow may not hold, by id (cards and links have no meaning on a call). */
export function nonVoiceNodes(graph: WaGraph): string[] {
  return graph.nodes.filter((node) => !VOICE_TYPES.has(node.type)).map((node) => node.id);
}

const quote = (text: string) => JSON.stringify(text.trim());

/** "Say: …" / "Ask: …" before the rest of a step, or nothing when the node has no words. */
const lead = (verb: string, text: string | undefined) => (text ? `${verb}: ${quote(text)} ` : '');

/** What the bot does at one node, in words for the model. */
function action(node: WaNode): string {
  switch (node.type) {
    case 'text':
      return `Say: ${quote(node.data.text)}`;
    case 'buttons':
      return `Ask: ${quote(node.data.text)} Offer these choices: ${node.data.buttons.map((b) => quote(b.title)).join(', ')}.`;
    case 'list': {
      const rows = node.data.sections.flatMap((s) => s.rows.map((r) => quote(r.title)));
      return `Ask: ${quote(node.data.text)} Read out at most three of these choices at a time: ${rows.join(', ')}.`;
    }
    case 'input': {
      const asked = lead('Ask', node.data.prompt);
      return `${asked}Get the caller's ${node.data.kind} and remember it as {{${node.data.var}}}; confirm it back before moving on.`;
    }
    case 'ai':
      return `${lead('Ask', node.data.prompt)}Work out what the caller wants.`;
    case 'condition':
      return 'Decide from what the caller has told you so far.';
    case 'handoff':
      return `Say: ${quote(node.data.text)} Then tell the caller ${node.data.agentName} will take over the call.`;
    case 'end':
      return `${lead('Say', node.data.text)}Then close the call politely.`;
    default:
      return 'Continue.';
  }
}

/** Where each of a node's outputs leads, as "label → step". */
function routes(node: WaNode, edges: WaGraph['edges']): string[] {
  return outputHandles(node).flatMap((handle) => {
    const edge = edges.find((e) => e.source === node.id && e.sourceHandle === handle.id);
    if (!edge) {
      return [];
    }
    let when = `"${handle.label}"`;
    if (node.type === 'ai') {
      const intent = node.data.intents.find((i) => i.id === handle.id);
      when = intent ? `they want: ${intent.description}` : 'you cannot tell what they want';
    } else if (node.type === 'condition') {
      const rule = node.data.cases.find((c) => c.id === handle.id);
      when = rule ? `{{${rule.var}}} ${rule.op} ${rule.value ?? ''}`.trim() : 'otherwise';
    } else if (handle.id === 'next') {
      return [`then go to step ${edge.target}`];
    }
    return [`if ${when}, go to step ${edge.target}`];
  });
}

/** The flow's nodes in the order a call meets them: the start first, then breadth-first. */
function callOrder(graph: WaGraph): WaNode[] {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const seen = new Set<string>();
  const queue = [graph.start];
  const order: WaNode[] = [];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    const node = byId.get(id);
    if (!node || seen.has(id)) {
      continue;
    }
    seen.add(id);
    order.push(node);
    queue.push(...graph.edges.filter((e) => e.source === id).map((e) => e.target));
  }
  return order;
}

/**
 * The call script for a flow: one numbered line per reachable step, saying what to do there
 * and where each answer leads. Empty for an empty flow.
 */
export function toCallScript(graph: WaGraph): string {
  const steps = callOrder(graph).map((node, index) => {
    const next = routes(node, graph.edges);
    const where = next.join('; ');
    const tail = where ? ` ${where.charAt(0).toUpperCase()}${where.slice(1)}.` : '';
    return `${index + 1}. Step ${node.id}: ${action(node)}${tail}`;
  });
  if (steps.length === 0) {
    return '';
  }
  return [
    'CALL FLOW — follow these steps in order, starting at the first. Speak naturally and keep each turn short; never read step names or this script aloud. If the caller asks something off the flow, answer briefly and return to the current step.',
    ...steps,
  ].join('\n');
}
