import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box } from '@/components/ui';
import { env } from '@/config/env';
import type { Role } from '@/auth/roles';
import { useCrossAppNavigate } from '@/hooks/useCrossAppNavigate';
import { PortalSwitcher } from '@/layout/PortalSwitcher';
import { navModules, navTree, type NavNode } from './moduleNav';
import { useNavState } from './useNavState';
import { SidebarHeader } from './SidebarHeader';
import { SidebarRail } from './SidebarRail';
import { SidebarNav } from './SidebarNav';

interface SidebarProps {
  roles: Role[];
  onNavigate?: () => void;
  /** Icon-rail mode. The mobile drawer never collapses, so it leaves this false. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * Navigation for this portal. The hub lists every module the roles can open; a
 * module app shows only its own pages, because every other portal is one click
 * away in the switcher above. Collapsed, both become an icon rail of their top
 * level with tooltips.
 */
export function Sidebar({
  roles,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: Readonly<SidebarProps>) {
  const navigateTo = useCrossAppNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState('');
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const isHub = env.portalApp === 'hub';
  const scoped = useMemo(() => navModules(roles, env.portalApp), [roles]);
  const tree = useMemo(() => navTree(scoped, isHub), [scoped, isHub]);
  const nav = useNavState(tree, pathname, query);

  const go = (node: NavNode) => {
    navigateTo(node.app, node.path);
    onNavigate?.();
  };

  /** A rail branch has nothing to show in the rail, so it opens the sidebar at itself. */
  const selectFromRail = (node: NavNode) => {
    if (node.children.length === 0) {
      go(node);
      return;
    }
    setQuery('');
    nav.open(node.key);
    onToggleCollapse?.();
  };

  const emptyText = isHub ? `No modules match “${query}”.` : `No page matches “${query}”.`;

  return (
    <Box>
      <SidebarHeader
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        onOpenSwitcher={() => setSwitcherOpen(true)}
        searchPlaceholder={isHub ? 'Search modules…' : 'Search pages…'}
        query={query}
        onQueryChange={setQuery}
      />

      <PortalSwitcher roles={roles} open={switcherOpen} onClose={() => setSwitcherOpen(false)} />

      {collapsed ? (
        <SidebarRail nodes={tree} trail={nav.trail} onSelect={selectFromRail} />
      ) : (
        <SidebarNav
          heading={isHub ? undefined : scoped[0]?.label}
          emptyText={emptyText}
          nav={nav}
          onSelect={go}
        />
      )}
    </Box>
  );
}
