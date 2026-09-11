import type { SvgIconComponent } from '@mui/icons-material';
import { accessibleModules, type ModuleChild, type ModuleDefinition } from '@/config/modules';
import { NAV_GROUP_ICONS, type NavGroup } from '@/config/navGroups';
import type { Role } from '@/auth/roles';
import type { PortalAppKey } from '@/config/apps';

/** How deep the sidebar nests, counting its top level as the first. */
export const MAX_NAV_DEPTH = 4;

/**
 * One entry in the sidebar tree. An entry with children is a branch: clicking it opens and
 * closes it rather than navigating. An entry without children is a page.
 */
export interface NavNode {
  key: string;
  label: string;
  icon: SvgIconComponent;
  /** Where a page goes. A branch carries its own path but is never navigated to. */
  path: string;
  /** The micro-frontend that serves `path`. */
  app: PortalAppKey;
  /** The owning module's colour. */
  accent: string;
  /** Extra words a search matches besides the label, e.g. a module's description. */
  keywords?: string;
  children: NavNode[];
}

/**
 * Modules whose navigation this app is responsible for. The hub is the launcher,
 * so it lists every portal the roles can open; a module app owns exactly one
 * portal, so it shows only that one — jumping elsewhere is what the portal
 * switcher is for. An app the roles cannot open yields nothing.
 */
export function navModules(roles: Role[], currentApp: PortalAppKey): ModuleDefinition[] {
  const all = accessibleModules(roles);
  if (currentApp === 'hub') return all;
  return all.filter((module) => module.key === currentApp);
}

function pageNode(child: ModuleChild, module: ModuleDefinition): NavNode {
  return {
    key: child.key,
    label: child.label,
    icon: child.icon,
    path: child.path,
    app: module.key,
    accent: module.accent,
    children: (child.children ?? []).map((c) => pageNode(c, module)),
  };
}

function sectionNode(group: NavGroup, module: ModuleDefinition): NavNode {
  return {
    key: `${module.key}:${group}`,
    label: group,
    icon: NAV_GROUP_ICONS[group],
    path: module.path,
    app: module.key,
    accent: module.accent,
    children: [],
  };
}

/** A childless module is one page: itself. */
function moduleLeaf(module: ModuleDefinition): NavNode {
  return {
    key: module.key,
    label: module.label,
    icon: module.icon,
    path: module.path,
    app: module.key,
    accent: module.accent,
    keywords: module.description,
    children: [],
  };
}

/**
 * A module's pages as its own app draws them: the ungrouped ones first, then one branch
 * per section in the order the config first names it.
 *
 * A module whose pages carry no group at all stays a plain list, so a five-page portal
 * does not grow headings over two items each.
 */
export function moduleNavTree(module: ModuleDefinition): NavNode[] {
  const children = module.children ?? [];
  if (children.length === 0) return [moduleLeaf(module)];

  const lead: NavNode[] = [];
  const sections = new Map<NavGroup, NavNode>();
  for (const child of children) {
    const node = pageNode(child, module);
    if (child.group) {
      const section = sections.get(child.group) ?? sectionNode(child.group, module);
      section.children.push(node);
      sections.set(child.group, section);
    } else {
      lead.push(node);
    }
  }
  return [...lead, ...sections.values()];
}

/**
 * The whole sidebar tree. A module app draws its own pages; the hub draws one branch per
 * module with that module's pages beneath it, sections left out, so both stop at the same
 * depth for the same config.
 */
export function navTree(modules: ModuleDefinition[], isHub: boolean): NavNode[] {
  if (!isHub) return modules.flatMap(moduleNavTree);
  return modules.map((module) => ({
    ...moduleLeaf(module),
    children: (module.children ?? []).map((child) => pageNode(child, module)),
  }));
}

/**
 * The tree as a search leaves it. An entry whose own words match keeps everything under
 * it — somebody who remembers a page as "one of the pay ones" finds it by its section —
 * and a branch that does not match stays only for the matches beneath it.
 */
export function filterNavTree(nodes: NavNode[], query: string): NavNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;
  return nodes.flatMap((node) => {
    if (`${node.label} ${node.keywords ?? ''}`.toLowerCase().includes(q)) return [node];
    const children = filterNavTree(node.children, q);
    return children.length > 0 ? [{ ...node, children }] : [];
  });
}

/** Every page's path, however deep it sits. Branches are never destinations. */
export function navPaths(nodes: NavNode[]): string[] {
  return nodes.flatMap((node) => (node.children.length > 0 ? navPaths(node.children) : [node.path]));
}

/** Keys from the top of the tree down to the page at `path`, or none when no page has it. */
export function navTrail(nodes: NavNode[], path: string | undefined): string[] {
  for (const node of nodes) {
    if (node.children.length === 0 && node.path === path) return [node.key];
    const below = navTrail(node.children, path);
    if (below.length > 0) return [node.key, ...below];
  }
  return [];
}

/** How many levels a tree nests. */
export function navDepth(nodes: NavNode[]): number {
  return nodes.reduce((deepest, node) => Math.max(deepest, 1 + navDepth(node.children)), 0);
}
