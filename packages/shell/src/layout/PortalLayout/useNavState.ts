import { useMemo, useState } from 'react';
import { activeNavPath } from './activeNavPath';
import { filterNavTree, navPaths, navTrail, type NavNode } from './moduleNav';

export interface NavState {
  /** The tree as the search leaves it. */
  visible: NavNode[];
  searching: boolean;
  /** Path of the page the URL belongs to. */
  activePath?: string;
  /** Keys of that page and of every branch above it. */
  trail: ReadonlySet<string>;
  isOpen: (key: string) => boolean;
  toggle: (key: string) => void;
  open: (key: string) => void;
}

/**
 * What the sidebar highlights and which branches are open.
 *
 * A branch opens when the page you are on lives inside it, and stays the way you left it
 * once you open or close it yourself. Nothing is remembered between visits on purpose:
 * where you are is a better answer to "what should be open" than where you were last week.
 *
 * While a search is running every match is shown, whatever is closed — a result you cannot
 * see is not a result.
 */
export function useNavState(tree: NavNode[], pathname: string, query: string): NavState {
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const searching = query.trim() !== '';
  const visible = useMemo(() => filterNavTree(tree, query), [tree, query]);

  // Matched against every page at once, so the deepest one wins and a search never
  // moves the highlight.
  const activePath = useMemo(() => activeNavPath(pathname, navPaths(tree)), [pathname, tree]);
  const trail = useMemo(() => new Set(navTrail(tree, activePath)), [tree, activePath]);

  return {
    visible,
    searching,
    activePath,
    trail,
    isOpen: (key) => searching || (opened[key] ?? trail.has(key)),
    toggle: (key) => setOpened((prev) => ({ ...prev, [key]: !(prev[key] ?? trail.has(key)) })),
    open: (key) => setOpened((prev) => ({ ...prev, [key]: true })),
  };
}
