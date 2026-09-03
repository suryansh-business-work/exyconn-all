import type { SvgIconComponent } from '@mui/icons-material';
import { accessibleModules, type ModuleDefinition } from '@/config/modules';
import type { Role } from '@/auth/roles';
import type { PortalAppKey } from '@/config/apps';

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: SvgIconComponent;
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

/**
 * The pages a module contributes to its own sidebar: its children, or the module
 * itself when it has none, filtered by a free-text query.
 */
export function moduleNavItems(module: ModuleDefinition, query = ''): NavItem[] {
  const children = module.children ?? [];
  const items: NavItem[] = children.length
    ? children.map((c) => ({ key: c.key, label: c.label, path: c.path, icon: c.icon }))
    : [{ key: module.key, label: module.label, path: module.path, icon: module.icon }];

  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.label.toLowerCase().includes(q));
}

/** A collapsed-sidebar entry: a nav item plus where it goes and how it is tinted. */
export interface RailItem extends NavItem {
  app: PortalAppKey;
  accent: string;
}

/**
 * The flat, icon-only list the collapsed sidebar shows. The hub rails one icon per
 * module (its children live behind the expanded list); a module app rails its own pages.
 */
export function railItems(modules: ModuleDefinition[], isHub: boolean): RailItem[] {
  if (isHub) {
    return modules.map((module) => ({
      key: module.key,
      label: module.label,
      path: module.path,
      icon: module.icon,
      app: module.key,
      accent: module.accent,
    }));
  }
  return modules.flatMap((module) =>
    moduleNavItems(module).map((item) => ({ ...item, app: module.key, accent: module.accent })),
  );
}
