import { describe, expect, it } from 'vitest';
import {
  CONDITION_OPS,
  demoSchema,
  dynamicRowsSchema,
  graphSchema,
  LIMITS,
  NODE_SCHEMAS,
  NODE_TYPES,
  nodeSchema,
  workflowSchema,
} from '../../src/schema';
import { DEMO } from './engine/fixtures';

const at = { x: 0, y: 0 };

describe('schema', () => {
  it('lists every node type once, in declaration order', () => {
    expect(NODE_TYPES).toEqual(Object.keys(NODE_SCHEMAS));
    expect(NODE_TYPES).toContain('condition');
    expect(new Set(NODE_TYPES).size).toBe(NODE_TYPES.length);
    expect(CONDITION_OPS).toContain('notEmpty');
  });

  it('accepts a valid buttons node and trims its strings', () => {
    const parsed = nodeSchema.parse({
      id: ' b1 ',
      type: 'buttons',
      position: at,
      data: { text: '  Pick  ', buttons: [{ id: 'y', title: ' Yes ' }] },
    });
    expect(parsed.id).toBe('b1');
    expect(parsed.type === 'buttons' && parsed.data.buttons[0].title).toBe('Yes');
  });

  it('enforces the WhatsApp button limits', () => {
    const buttons = Array.from({ length: LIMITS.buttons + 1 }, (_, i) => ({
      id: `b${i}`,
      title: 'Ok',
    }));
    const tooMany = nodeSchema.safeParse({
      id: 'n',
      type: 'buttons',
      position: at,
      data: { text: 'Pick', buttons },
    });
    expect(tooMany.success).toBe(false);
    const longTitle = nodeSchema.safeParse({
      id: 'n',
      type: 'buttons',
      position: at,
      data: { text: 'Pick', buttons: [{ id: 'b', title: 'x'.repeat(LIMITS.buttonTitle + 1) }] },
    });
    expect(longTitle.success).toBe(false);
  });

  it('rejects an unknown node type and an empty text', () => {
    expect(nodeSchema.safeParse({ id: 'n', type: 'video', position: at, data: {} }).success).toBe(
      false,
    );
    expect(
      nodeSchema.safeParse({ id: 'n', type: 'text', position: at, data: { text: '   ' } }).success,
    ).toBe(false);
  });

  it('discriminates dynamic rows by kind and checks their bounds', () => {
    expect(dynamicRowsSchema.parse({ kind: 'days', count: 7, var: 'day' }).kind).toBe('days');
    expect(
      dynamicRowsSchema.safeParse({
        kind: 'slots',
        dayVar: 'day',
        from: 9,
        to: 25,
        stepMin: 30,
        take: 4,
        var: 'slot',
      }).success,
    ).toBe(false);
    expect(dynamicRowsSchema.safeParse({ kind: 'days', count: 0, var: 'day' }).success).toBe(false);
  });

  it('bounds delay and reminder timings', () => {
    const delay = (ms: number) =>
      nodeSchema.safeParse({ id: 'd', type: 'delay', position: at, data: { ms } }).success;
    expect(delay(100)).toBe(true);
    expect(delay(99)).toBe(false);
    expect(delay(60_001)).toBe(false);
  });

  it('needs at least one node in a graph', () => {
    expect(graphSchema.safeParse({ start: 'a', nodes: [], edges: [] }).success).toBe(false);
  });

  it('only accepts slug workflow keys', () => {
    const workflow = {
      key: 'book-visit',
      name: 'Book',
      description: '',
      keywords: ['book'],
      order: 0,
      graph: {
        start: 'a',
        nodes: [{ id: 'a', type: 'end', position: at, data: { showMenu: true } }],
        edges: [],
      },
    };
    expect(workflowSchema.safeParse(workflow).success).toBe(true);
    expect(workflowSchema.safeParse({ ...workflow, key: 'Book Visit' }).success).toBe(false);
  });

  it('parses a demo profile and rejects an unknown accent', () => {
    expect(demoSchema.parse(DEMO)).toEqual(DEMO);
    const bad = { ...DEMO, business: { ...DEMO.business, accent: 'neon' } };
    expect(demoSchema.safeParse(bad).success).toBe(false);
  });
});
