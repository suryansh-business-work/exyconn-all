import { describe, expect, it, vi } from 'vitest';
import { toDemoBundle, type CatalogEntry } from '../../src/catalog';
import { DEMO, makeWorkflow } from './engine/fixtures';

const good = makeWorkflow('good', [{ id: 'end', type: 'end', data: { showMenu: true } }], {
  keywords: ['hello'],
});

function entry(overrides: Partial<CatalogEntry> = {}): CatalogEntry {
  return {
    demo: { ...DEMO },
    workflows: [good, { ...good, key: 'broken', graph: { start: 'x', nodes: [], edges: [] } }],
    ...overrides,
  };
}

describe('toDemoBundle', () => {
  it('drops a workflow whose graph does not parse and says so', () => {
    const warn = vi.fn();
    const bundle = toDemoBundle(entry(), warn);
    expect(bundle?.workflows.map((w) => w.key)).toEqual(['good']);
    expect(bundle?.demo).toEqual(DEMO);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('wa-demo: workflow graph did not parse', expect.anything(), {
      workflow: 'broken',
    });
  });

  it('copies each workflow with a fresh keywords array', () => {
    const bundle = toDemoBundle(entry({ workflows: [good] }), vi.fn());
    expect(bundle?.workflows[0]).toEqual(good);
    expect(bundle?.workflows[0].keywords).not.toBe(good.keywords);
  });

  it('returns null when the business profile does not parse', () => {
    const warn = vi.fn();
    const bad = entry({ demo: { ...DEMO, business: { name: '' } } });
    expect(toDemoBundle(bad, warn)).toBeNull();
    expect(warn).toHaveBeenCalledWith('wa-demo: demo profile did not parse', expect.anything(), {
      demo: 'demo',
    });
  });
});
