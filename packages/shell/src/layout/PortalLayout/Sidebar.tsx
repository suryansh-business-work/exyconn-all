import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, List, Typography } from '@/components/ui';
import { env } from '@/config/env';
import type { Role } from '@/auth/roles';
import { useCrossAppNavigate } from '@/hooks/useCrossAppNavigate';
import type { PortalAppKey } from '@/config/apps';
import { PortalSwitcher } from '@/layout/PortalSwitcher';
import { navModules, railItems } from './moduleNav';
import { activeNavPath } from './activeNavPath';
import { ModuleNavList } from './ModuleNavList';
import { SidebarHeader } from './SidebarHeader';
import { SidebarRail } from './SidebarRail';
import { HubModuleItem } from './HubModuleItem';

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
 * away in the switcher above. Collapsed, both become an icon rail with tooltips.
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
  const modules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !isHub) return scoped;
    return scoped.filter((m) => `${m.label} ${m.description}`.toLowerCase().includes(q));
  }, [scoped, query, isHub]);

  /**
   * The URL decides what is highlighted, and it is matched against every entry
   * at once so the deepest one wins — a tab slug or a detail id below a page
   * keeps that page selected instead of falling through to a shorter prefix.
   * Computed from the unfiltered list so searching never changes the highlight.
   */
  const active = useMemo(
    () =>
      activeNavPath(
        pathname,
        scoped.flatMap((m) => [m.path, ...(m.children ?? []).map((c) => c.path)]),
      ),
    [pathname, scoped],
  );

  const go = (app: PortalAppKey, path: string) => {
    navigateTo(app, path);
    onNavigate?.();
  };

  const rail = useMemo(() => railItems(scoped, isHub), [scoped, isHub]);

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

      {collapsed && (
        <SidebarRail
          items={rail}
          activePath={active}
          onSelect={(item) => go(item.app, item.path)}
        />
      )}

      {!collapsed && isHub && (
        <List sx={{ px: 1, py: 0 }}>
          {modules.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
              No modules match “{query}”.
            </Typography>
          )}
          {modules.map((module) => (
            <HubModuleItem
              key={module.key}
              module={module}
              activePath={active}
              onSelect={(path) => go(module.key, path)}
            />
          ))}
        </List>
      )}

      {!collapsed &&
        !isHub &&
        modules.map((module) => (
          <ModuleNavList
            key={module.key}
            module={module}
            pathname={pathname}
            query={query}
            onSelect={(path) => go(module.key, path)}
          />
        ))}
    </Box>
  );
}
