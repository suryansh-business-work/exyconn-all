import { describe, expect, it } from 'vitest';
import type { WaGraph } from '@exyconn/wa-flow';
import {
  REHEARSAL_KEY,
  flowOf,
  rehearsalBundle,
  starterFlow,
} from '../../../../../src/pages/demos/call-flows/callFlow.model';
import { flowRow } from '../calling-bot.fixtures';

const stored: WaGraph = {
  start: 'hello',
  nodes: [
    {
      id: 'hello',
      type: 'end',
      data: { text: 'Bye.', showMenu: false },
      position: { x: 0, y: 0 },
    },
  ],
  edges: [],
};

describe('starterFlow', () => {
  it('opens with the example’s greeting, then closes politely', () => {
    const graph = starterFlow(flowRow({ greeting: 'Namaste, Smile Dental.' }));
    expect(graph.start).toBe('greet');
    expect(graph.nodes.map((node) => [node.id, node.type])).toEqual([
      ['greet', 'text'],
      ['close', 'end'],
    ]);
    expect(graph.nodes[0].data).toMatchObject({ text: 'Namaste, Smile Dental.' });
    expect(graph.edges).toEqual([expect.objectContaining({ source: 'greet', target: 'close' })]);
  });
});

describe('flowOf', () => {
  it('uses the stored flow when the example has one', () => {
    expect(flowOf(flowRow({ flow: stored }))).toBe(stored);
  });

  it('starts from the greeting when nothing is stored', () => {
    expect(flowOf(flowRow({ flow: null })).start).toBe('greet');
  });
});

describe('rehearsalBundle', () => {
  it('wraps the graph as a one-workflow website demo named after the example', () => {
    const row = flowRow({ id: 'sc-9', title: 'Loan reminder', description: 'An EMI is due.' });
    const bundle = rehearsalBundle(row, stored);
    expect(bundle.demo).toMatchObject({
      key: 'call-sc-9',
      channel: 'website',
      active: true,
      business: { name: 'Loan reminder', tagline: 'An EMI is due.', about: 'An EMI is due.' },
    });
    expect(bundle.workflows).toEqual([
      { key: REHEARSAL_KEY, name: 'Call', description: '', keywords: [], order: 0, graph: stored },
    ]);
  });
});
