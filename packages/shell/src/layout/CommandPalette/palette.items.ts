import { accessibleModules, appForPath, type ModuleDefinition } from '@/config/modules';
import type { Role } from '@/auth/roles';
import type { PortalAppKey } from '@/config/apps';
import type { SearchQuery } from '@/graphql/generated';

/** One row in the palette, whichever kind of thing it stands for. */
export interface PaletteItem {
  /** Unique within the list, so keys are stable while the list changes under the cursor. */
  id: string;
  title: string;
  subtitle: string;
  /** Which group heading it sits under. */
  group: string;
  app: PortalAppKey;
  path: string;
}

/** Modules whose name contains what was typed — the palette's instant half. */
export function moduleItems(roles: Role[], query: string): PaletteItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [];
  }
  return accessibleModules(roles)
    .filter((module: ModuleDefinition) => module.label.toLowerCase().includes(needle))
    .map((module) => ({
      id: `module:${module.key}`,
      title: module.label,
      subtitle: 'Open this module',
      group: 'Modules',
      app: module.key,
      path: module.path,
    }));
}

/**
 * Records the server found, flattened into one navigable list.
 *
 * Each hit's link names its own portal path, so the app is worked out from the path rather
 * than assumed to be this one: a finance invoice found from the HR portal has to open in
 * Finance.
 */
export function recordItems(data: SearchQuery | undefined): PaletteItem[] {
  return (data?.search ?? []).flatMap((group) =>
    group.hits.flatMap((hit) => {
      const app = appForPath(hit.link);
      if (!app) {
        return [];
      }
      return [
        {
          id: `${group.key}:${hit.id}`,
          title: hit.title,
          subtitle: hit.subtitle,
          group: group.label,
          app,
          path: hit.link,
        },
      ];
    }),
  );
}

/** Group headings in the order they should be shown, each with its own items. */
export function groupItems(items: readonly PaletteItem[]) {
  const groups: { label: string; items: PaletteItem[] }[] = [];
  for (const item of items) {
    const existing = groups.find((group) => group.label === item.group);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ label: item.group, items: [item] });
    }
  }
  return groups;
}
