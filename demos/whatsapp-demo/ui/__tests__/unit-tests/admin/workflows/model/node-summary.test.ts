import { describe, expect, it } from 'vitest';
import type { NodeType, WaNode } from '@exyconn/wa-flow';
import { defaultNodeData } from '../../../../../src/admin/workflows/model/node-defaults';
import { nodeSummary } from '../../../../../src/admin/workflows/model/node-summary';

function nodeOf(type: NodeType, patch: Record<string, unknown> = {}): WaNode {
  const data = { ...defaultNodeData(type, ['faq']), ...patch };
  return { id: `${type}-1`, type, position: { x: 0, y: 0 }, data } as WaNode;
}

describe('nodeSummary', () => {
  it.each([
    ['text', 'Your message here.'],
    ['notice', 'A notice for the customer.'],
    ['buttons', 'Choose an option.'],
    ['list', 'Pick one of these.'],
    ['cta', 'Find out more on our website.'],
    ['handoff', 'Hi {{user.firstName}}, I can help with that.'],
    ['image', 'Image'],
    ['document', 'document.pdf'],
    ['location', 'Our office'],
    ['contact', 'Front desk'],
    ['product', 'Product'],
    ['ticket', 'Your ticket'],
    ['order', 'Your order'],
    ['ai', 'How can I help you today?'],
  ] as const)('shows what a %s node says as written', (type, text) => {
    expect(nodeSummary(nodeOf(type))).toEqual({ kind: 'content', text });
  });

  it('prefers an image caption over the illustration title', () => {
    expect(nodeSummary(nodeOf('image', { caption: 'Our clinic' }))).toEqual({
      kind: 'content',
      text: 'Our clinic',
    });
  });

  it('shows an empty line for an AI node without a prompt', () => {
    expect(nodeSummary(nodeOf('ai', { prompt: undefined }))).toEqual({ kind: 'content', text: '' });
  });

  it('counts carousel cards and condition cases', () => {
    expect(nodeSummary(nodeOf('carousel'))).toEqual({
      kind: 'phrase',
      text: '{count} cards',
      values: { count: 1 },
    });
    expect(nodeSummary(nodeOf('condition'))).toEqual({
      kind: 'phrase',
      text: '{count} cases, then otherwise',
      values: { count: 1 },
    });
  });

  it('says what an Ask node saves and where', () => {
    expect(nodeSummary(nodeOf('input'))).toEqual({
      kind: 'phrase',
      text: 'Saves a {kind} answer in "{name}"',
      values: { kind: 'name', name: 'name' },
    });
  });

  it('converts delays and reminders to seconds', () => {
    expect(nodeSummary(nodeOf('delay', { ms: 2500 }))).toEqual({
      kind: 'phrase',
      text: 'Waits {seconds} s',
      values: { seconds: 2.5 },
    });
    expect(nodeSummary(nodeOf('reminder'))).toEqual({
      kind: 'phrase',
      text: 'After {seconds} s',
      values: { seconds: 60 },
    });
  });

  it('names the workflow a Jump starts', () => {
    expect(nodeSummary(nodeOf('jump'))).toEqual({
      kind: 'phrase',
      text: 'Starts "{key}"',
      values: { key: 'faq' },
    });
  });

  it('says an End shows the menu, or shows its closing text when it does not', () => {
    expect(nodeSummary(nodeOf('end'))).toEqual({
      kind: 'phrase',
      text: 'Ends and shows the menu',
      values: undefined,
    });
    expect(nodeSummary(nodeOf('end', { showMenu: false, text: 'Bye' }))).toEqual({
      kind: 'content',
      text: 'Bye',
    });
  });

  it('shows nothing for a node type it does not know', () => {
    const unknown = { id: 'x', type: 'mystery', position: { x: 0, y: 0 }, data: {} };
    expect(nodeSummary(unknown as unknown as WaNode)).toEqual({ kind: 'content', text: '' });
  });
});
