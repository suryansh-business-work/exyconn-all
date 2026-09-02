import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import { accessibleModules } from '@/config/modules';
import type { Role } from '@/auth/roles';
import type { PortalAppKey } from '@/config/apps';
import type { PortalEntry } from './PortalListItem';

/** The launcher is not a module, so it is described here rather than in MODULES. */
const HUB_ENTRY = {
  key: 'hub',
  label: 'Portal Home',
  description: 'Module launcher, profile & settings',
  app: 'hub' as PortalAppKey,
  path: '/',
  icon: SpaceDashboardIcon,
  accent: '#155dfc',
};

/**
 * Portals the given roles can open — the launcher plus every accessible module —
 * marking which one is the app doing the asking, filtered by a free-text query.
 */
export function buildPortalEntries(
  roles: Role[],
  currentApp: PortalAppKey,
  query = '',
): PortalEntry[] {
  const all: PortalEntry[] = [
    { ...HUB_ENTRY, isCurrent: currentApp === HUB_ENTRY.app },
    ...accessibleModules(roles).map((m) => ({
      key: m.key,
      label: m.label,
      description: m.description,
      app: m.key,
      path: m.path,
      icon: m.icon,
      accent: m.accent,
      isCurrent: currentApp === m.key,
    })),
  ];

  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter((e) => `${e.label} ${e.description}`.toLowerCase().includes(q));
}
