import { describe, expect, it } from 'vitest';
import { graphSchema, type WaGraph } from '../../src/schema';
import { VOICE_NODE_TYPES, nonVoiceNodes, toCallScript } from '../../src/voice';

const at = { x: 0, y: 0 };
const HEADER = 'CALL FLOW — follow these steps in order';

type NodeInput = { id: string; type: string; data: Record<string, unknown> };
type EdgeInput = [source: string, sourceHandle: string, target: string];

/** A call flow checked against the real schema, so every fixture is one the editor could save. */
function flow(start: string, nodes: NodeInput[], edges: EdgeInput[] = []): WaGraph {
  return graphSchema.parse({
    start,
    nodes: nodes.map((node) => ({ ...node, position: at })),
    edges: edges.map(([source, sourceHandle, target]) => ({
      id: `${source}-${sourceHandle}`,
      source,
      sourceHandle,
      target,
    })),
  });
}

/** The numbered steps of a script, without its standing instructions. */
const steps = (graph: WaGraph) => toCallScript(graph).split('\n').slice(1);

describe('VOICE_NODE_TYPES and nonVoiceNodes', () => {
  it('lists the node types a call can carry', () => {
    expect(VOICE_NODE_TYPES).toEqual([
      'text',
      'buttons',
      'list',
      'input',
      'ai',
      'condition',
      'handoff',
      'end',
    ]);
  });

  it('names the nodes a call flow may not hold', () => {
    const graph = flow('hi', [
      { id: 'hi', type: 'text', data: { text: 'Hello' } },
      { id: 'card', type: 'notice', data: { text: 'Read this' } },
      { id: 'wait', type: 'delay', data: { ms: 500 } },
      { id: 'bye', type: 'end', data: { showMenu: false } },
    ]);
    expect(nonVoiceNodes(graph)).toEqual(['card', 'wait']);
  });

  it('finds nothing to remove in a pure call flow', () => {
    expect(nonVoiceNodes(flow('hi', [{ id: 'hi', type: 'text', data: { text: 'Hi' } }]))).toEqual(
      [],
    );
  });
});

describe('toCallScript', () => {
  it('opens with the standing instructions and numbers steps in call order', () => {
    const script = toCallScript(
      flow(
        'hi',
        [
          { id: 'bye', type: 'end', data: { text: ' Goodbye ', showMenu: false } },
          { id: 'hi', type: 'text', data: { text: 'Welcome to Acme' } },
        ],
        [['hi', 'next', 'bye']],
      ),
    );
    const [header, ...rest] = script.split('\n');
    expect(header.startsWith(HEADER)).toBe(true);
    expect(rest).toEqual([
      '1. Step hi: Say: "Welcome to Acme" Then go to step bye.',
      '2. Step bye: Say: "Goodbye" Then close the call politely.',
    ]);
  });

  it('is empty when the start step does not exist', () => {
    expect(toCallScript(flow('missing', [{ id: 'hi', type: 'text', data: { text: 'Hi' } }]))).toBe(
      '',
    );
  });

  it('offers spoken choices and says where each leads, skipping unwired ones', () => {
    const graph = flow(
      'menu',
      [
        {
          id: 'menu',
          type: 'buttons',
          data: {
            text: 'What can I help with?',
            buttons: [
              { id: 'book', title: 'Book' },
              { id: 'price', title: 'Prices' },
            ],
          },
        },
        { id: 'booking', type: 'text', data: { text: 'Let us book.' } },
      ],
      [['menu', 'book', 'booking']],
    );
    expect(steps(graph)[0]).toBe(
      '1. Step menu: Ask: "What can I help with?" Offer these choices: "Book", "Prices". If "Book", go to step booking.',
    );
  });

  it('reads list rows a few at a time', () => {
    const graph = flow('pick', [
      {
        id: 'pick',
        type: 'list',
        data: {
          text: 'Pick a branch',
          button: 'Branches',
          sections: [
            { id: 'n', title: 'North', rows: [{ id: 'a', title: 'Andheri' }] },
            { id: 's', title: 'South', rows: [{ id: 'b', title: 'Bandra' }] },
          ],
        },
      },
    ]);
    expect(steps(graph)).toEqual([
      '1. Step pick: Ask: "Pick a branch" Read out at most three of these choices at a time: "Andheri", "Bandra".',
    ]);
  });

  it('asks for an answer, with or without a spoken prompt', () => {
    const graph = flow(
      'name',
      [
        { id: 'name', type: 'input', data: { prompt: 'Your name?', var: 'name', kind: 'name' } },
        { id: 'mail', type: 'input', data: { var: 'email', kind: 'email' } },
      ],
      [['name', 'next', 'mail']],
    );
    expect(steps(graph)).toEqual([
      '1. Step name: Ask: "Your name?" Get the caller\'s name and remember it as {{name}}; confirm it back before moving on. Then go to step mail.',
      "2. Step mail: Get the caller's email and remember it as {{email}}; confirm it back before moving on.",
    ]);
  });

  it('routes by what the caller wants, with a way out when it is unclear', () => {
    const graph = flow(
      'triage',
      [
        {
          id: 'triage',
          type: 'ai',
          data: {
            prompt: 'How can I help?',
            intents: [
              { id: 'book', description: 'to book a visit' },
              { id: 'cancel', description: 'to cancel' },
            ],
            entities: [],
          },
        },
        { id: 'booking', type: 'text', data: { text: 'Booking.' } },
        { id: 'human', type: 'handoff', data: { text: 'One moment.', agentName: 'Priya' } },
      ],
      [
        ['triage', 'book', 'booking'],
        ['triage', 'fallback', 'human'],
      ],
    );
    expect(steps(graph)).toEqual([
      '1. Step triage: Ask: "How can I help?" Work out what the caller wants. If they want: to book a visit, go to step booking; if you cannot tell what they want, go to step human.',
      '2. Step booking: Say: "Booking."',
      '3. Step human: Say: "One moment." Then tell the caller Priya will take over the call.',
    ]);
  });

  it('works out the intent without a prompt', () => {
    const graph = flow('ai', [{ id: 'ai', type: 'ai', data: { intents: [], entities: [] } }]);
    expect(steps(graph)).toEqual(['1. Step ai: Work out what the caller wants.']);
  });

  it('spells out each condition, with or without a value, and the fallback', () => {
    const graph = flow(
      'check',
      [
        {
          id: 'check',
          type: 'condition',
          data: {
            cases: [
              { id: 'vip', var: 'tier', op: 'eq', value: 'gold' },
              { id: 'noname', var: 'name', op: 'empty' },
            ],
          },
        },
        { id: 'a', type: 'text', data: { text: 'A' } },
        { id: 'b', type: 'text', data: { text: 'B' } },
        { id: 'c', type: 'end', data: { showMenu: true } },
      ],
      [
        ['check', 'vip', 'a'],
        ['check', 'noname', 'b'],
        ['check', 'else', 'c'],
      ],
    );
    expect(steps(graph)[0]).toBe(
      '1. Step check: Decide from what the caller has told you so far. If {{tier}} eq gold, go to step a; if {{name}} empty, go to step b; if otherwise, go to step c.',
    );
    expect(steps(graph)[3]).toBe('4. Step c: Then close the call politely.');
  });

  it('visits each step once, ignoring loops and edges to missing steps', () => {
    const graph = flow(
      'a',
      [
        { id: 'a', type: 'text', data: { text: 'A' } },
        { id: 'b', type: 'text', data: { text: 'B' } },
      ],
      [
        ['a', 'next', 'b'],
        ['b', 'next', 'a'],
        ['b', 'other', 'ghost'],
      ],
    );
    expect(steps(graph)).toEqual([
      '1. Step a: Say: "A" Then go to step b.',
      '2. Step b: Say: "B" Then go to step a.',
    ]);
  });

  it('keeps a step that is not meant for a call moving', () => {
    const graph = flow('note', [{ id: 'note', type: 'notice', data: { text: 'Read' } }]);
    expect(steps(graph)).toEqual(['1. Step note: Continue.']);
  });
});
