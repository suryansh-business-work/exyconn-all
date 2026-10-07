import { describe, expect, it } from 'vitest';
import { NODE_TYPES } from '@exyconn/wa-flow';
import { NODE_GROUPS, NODE_META } from '../../../../../src/admin/workflows/model/node-meta';

describe('NODE_META', () => {
  it('describes every node type the schema has, and nothing else', () => {
    expect(Object.keys(NODE_META)).toHaveLength(NODE_TYPES.length);
    expect(new Set(Object.keys(NODE_META))).toEqual(new Set(NODE_TYPES));
  });

  it.each(NODE_TYPES)('gives %s a label, hint, icon and a palette group', (type) => {
    const meta = NODE_META[type];
    expect(meta.label.length).toBeGreaterThan(0);
    expect(meta.hint.length).toBeGreaterThan(0);
    expect(meta.icon).toBeTruthy();
    expect(NODE_GROUPS).toContain(meta.group);
  });

  it('puts at least one node type in every palette group', () => {
    const used = new Set(Object.values(NODE_META).map((m) => m.group));
    expect(used).toEqual(new Set(NODE_GROUPS));
  });
});
