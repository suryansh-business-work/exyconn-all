import { describe, expect, it } from 'vitest';
import { NODE_SCHEMAS, NODE_TYPES } from '@exyconn/wa-flow';
import { defaultNodeData } from '../../../../../src/admin/workflows/model/node-defaults';

describe('defaultNodeData', () => {
  it.each(NODE_TYPES)('gives a new %s node data that passes its schema', (type) => {
    const node = { id: 'n-1', type, position: { x: 0, y: 0 }, data: defaultNodeData(type, []) };
    expect(NODE_SCHEMAS[type].safeParse(node).success).toBe(true);
  });

  it("points a Jump at the demo's first workflow", () => {
    expect(defaultNodeData('jump', ['booking', 'faq'])).toEqual({ workflowKey: 'booking' });
  });

  it('points a Jump at "main" when the demo has no workflows yet', () => {
    expect(defaultNodeData('jump', [])).toEqual({ workflowKey: 'main' });
  });

  it('hands out a fresh copy each time, so editing one node never changes another', () => {
    const first = defaultNodeData('buttons', []);
    first.buttons[0].title = 'Changed';
    expect(defaultNodeData('buttons', []).buttons[0].title).toBe('Yes');
  });

  it('gives a single product card without a button', () => {
    const { product } = defaultNodeData('product', []);
    expect(product.id).toBe('product-1');
    expect(product.buttonTitle).toBeUndefined();
  });
});
