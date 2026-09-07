import { describe, it, expect } from 'vitest';
import { buildOrgTree, teamSize } from '../../src/pages/org-chart/org-tree';

const person = (id: string, name: string, managerId: string | null = null) => ({
  id,
  name,
  managerId,
});

describe('buildOrgTree', () => {
  it('nests reports under their manager, sorted by name at every level', () => {
    const { trees, unplaced } = buildOrgTree([
      person('ceo', 'Zara'),
      person('b', 'Bilal', 'ceo'),
      person('a', 'Asha', 'ceo'),
      person('c', 'Chen', 'a'),
    ]);

    expect(unplaced).toEqual([]);
    expect(trees.map((t) => t.id)).toEqual(['ceo']);
    expect(trees[0].reports.map((r) => r.id)).toEqual(['a', 'b']);
    expect(trees[0].reports[0].reports.map((r) => r.id)).toEqual(['c']);
  });

  it('puts people with no manager and no reports in the unplaced group', () => {
    const { trees, unplaced } = buildOrgTree([
      person('m', 'Meera'),
      person('r', 'Ravi', 'm'),
      person('o', 'Omar'),
    ]);

    expect(trees.map((t) => t.id)).toEqual(['m']);
    expect(unplaced.map((u) => u.id)).toEqual(['o']);
  });

  it('treats a report whose manager is not in the list as a root', () => {
    const { trees, unplaced } = buildOrgTree([person('r', 'Ravi', 'gone')]);

    expect(trees).toEqual([]);
    expect(unplaced.map((u) => u.id)).toEqual(['r']);
  });

  it('breaks a reporting cycle so the tree stays finite', () => {
    const { trees } = buildOrgTree([person('a', 'Asha', 'b'), person('b', 'Bilal', 'a')]);

    expect(trees.map((t) => t.id)).toEqual(['a']);
    expect(trees[0].reports.map((r) => r.id)).toEqual(['b']);
    expect(trees[0].reports[0].reports).toEqual([]);
  });

  it('ignores somebody set as their own manager', () => {
    const { unplaced } = buildOrgTree([person('a', 'Asha', 'a')]);

    expect(unplaced.map((u) => u.id)).toEqual(['a']);
  });
});

describe('teamSize', () => {
  it('counts every level below a node', () => {
    const { trees } = buildOrgTree([
      person('ceo', 'Zara'),
      person('a', 'Asha', 'ceo'),
      person('b', 'Bilal', 'a'),
      person('c', 'Chen', 'a'),
    ]);

    expect(teamSize(trees[0])).toBe(3);
    expect(teamSize(trees[0].reports[0])).toBe(2);
  });
});
