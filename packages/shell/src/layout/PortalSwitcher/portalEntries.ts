import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import { MODULES, accessibleModules, type ModuleDefinition } from '@/config/modules';
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

/** The launcher plus the given modules as rows, marking the app doing the asking. */
function toEntries(modules: ModuleDefinition[], currentApp: PortalAppKey): PortalEntry[] {
  return [
    { ...HUB_ENTRY, isCurrent: currentApp === HUB_ENTRY.app },
    ...modules.map((m) => ({
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
}

/** Free-text match over the name and the one-line description. */
function search(entries: PortalEntry[], query: string): PortalEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((e) => `${e.label} ${e.description}`.toLowerCase().includes(q));
}

/**
 * Portals the given roles can open — the launcher plus every accessible module —
 * marking which one is the app doing the asking, filtered by a free-text query.
 */
export function buildPortalEntries(
  roles: Role[],
  currentApp: PortalAppKey,
  query = '',
): PortalEntry[] {
  return search(toEntries(accessibleModules(roles), currentApp), query);
}

/**
 * Every portal there is, for the login screen: nobody has signed in yet, so no roles
 * are known to filter by. Opening one lands on that portal's own gate, which signs
 * the visitor straight in when the shared session cookie already grants them access.
 */
export function allPortalEntries(currentApp: PortalAppKey, query = ''): PortalEntry[] {
  return search(toEntries(MODULES, currentApp), query);
}
