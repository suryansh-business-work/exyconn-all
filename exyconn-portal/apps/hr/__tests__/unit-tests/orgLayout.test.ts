import { describe, it, expect } from 'vitest';
import { buildOrgTree } from '../../src/pages/org-chart/org-tree';
import { layoutOrgForest, NODE_WIDTH } from '../../src/pages/org-chart/org-layout';

const person = (id: string, name: string, managerId: string | null = null) => ({
  id,
  name,
  managerId,
});

const layoutOf = (people: ReturnType<typeof person>[]) => {
  const { placed, links } = layoutOrgForest(buildOrgTree(people).trees);
  const at = new Map(placed.map((p) => [p.node.id, p]));
  return { placed, links, at };
};

describe('layoutOrgForest', () => {
  it('puts a manager one level above their reports, centred over them', () => {
    const { at } = layoutOf([
      person('m', 'Maya'),
      person('a', 'Asha', 'm'),
      person('b', 'Bo', 'm'),
    ]);
    const manager = at.get('m')!;
    const [a, b] = [at.get('a')!, at.get('b')!];

    expect(a.y).toBeGreaterThan(manager.y);
    expect(a.y).toBe(b.y);
    expect(manager.x + NODE_WIDTH / 2).toBe((a.x + b.x + NODE_WIDTH) / 2);
  });

  it('never overlaps two cards on the same level', () => {
    const { placed } = layoutOf([
      person('ceo', 'Zara'),
      person('a', 'Asha', 'ceo'),
      person('b', 'Bilal', 'ceo'),
      person('c', 'Chen', 'a'),
      person('d', 'Dev', 'a'),
      person('e', 'Ema', 'b'),
      person('x', 'Xi'),
      person('y', 'Yan', 'x'),
    ]);
    const byLevel = new Map<number, number[]>();
    for (const p of placed) byLevel.set(p.y, [...(byLevel.get(p.y) ?? []), p.x]);
    for (const xs of byLevel.values()) {
      const sorted = [...xs].sort((l, r) => l - r);
      sorted.slice(1).forEach((x, i) => expect(x - sorted[i]).toBeGreaterThanOrEqual(NODE_WIDTH));
    }
  });

  it('links every report to their manager exactly once', () => {
    const { links } = layoutOf([
      person('m', 'Maya'),
      person('a', 'Asha', 'm'),
      person('c', 'Chen', 'a'),
    ]);
    expect(links).toEqual([
      { managerId: 'm', reportId: 'a' },
      { managerId: 'a', reportId: 'c' },
    ]);
  });
});
