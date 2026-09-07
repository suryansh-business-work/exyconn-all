/** One person as the `orgChart` query returns them. */
export interface OrgPerson {
  id: string;
  name: string;
  designation?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
  managerId?: string | null;
}

export interface OrgTreeNode extends OrgPerson {
  reports: OrgTreeNode[];
}

export interface OrgTree {
  /** Roots that have somebody reporting to them — the reporting lines proper. */
  trees: OrgTreeNode[];
  /** People with no manager and no reports: not placed in the chart yet. */
  unplaced: OrgTreeNode[];
}

const byName = (a: OrgPerson, b: OrgPerson) => a.name.localeCompare(b.name);

/**
 * Nests a flat list by `managerId`. A manager who is not in the list (deactivated, deleted)
 * makes their reports roots rather than losing them; a reporting cycle (A reports to B, B to
 * A) is broken at its first member by name so the tree is always finite.
 */
export function buildOrgTree(people: OrgPerson[]): OrgTree {
  const nodes = new Map<string, OrgTreeNode>(
    people.map((person) => [person.id, { ...person, reports: [] }]),
  );
  const roots: OrgTreeNode[] = [];
  for (const node of nodes.values()) {
    const manager = node.managerId ? nodes.get(node.managerId) : undefined;
    if (manager && manager !== node) {
      manager.reports.push(node);
    } else {
      roots.push(node);
    }
  }

  const reachable = new Set<string>();
  const visit = (node: OrgTreeNode) => {
    if (reachable.has(node.id)) return;
    reachable.add(node.id);
    node.reports.forEach(visit);
  };
  roots.forEach(visit);
  for (const node of [...nodes.values()].sort(byName)) {
    if (reachable.has(node.id)) continue;
    const manager = nodes.get(node.managerId ?? '');
    if (manager) manager.reports = manager.reports.filter((report) => report.id !== node.id);
    roots.push(node);
    visit(node);
  }

  for (const node of nodes.values()) node.reports.sort(byName);
  roots.sort(byName);
  return {
    trees: roots.filter((root) => root.reports.length > 0),
    unplaced: roots.filter((root) => root.reports.length === 0),
  };
}

/** Everyone under a node, at any depth. */
export function teamSize(node: OrgTreeNode): number {
  return node.reports.reduce((total, report) => total + 1 + teamSize(report), 0);
}
