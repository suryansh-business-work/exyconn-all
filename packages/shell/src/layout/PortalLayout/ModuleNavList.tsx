import { List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@/components/ui';
import type { ModuleDefinition } from '@/config/modules';
import { moduleNavItems } from './moduleNav';
import { activeNavPath } from './activeNavPath';

interface ModuleNavListProps {
  module: ModuleDefinition;
  pathname: string;
  query: string;
  onSelect: (path: string) => void;
}

/** This portal's own pages, flat — a module app serves exactly one module. */
export function ModuleNavList({ module, pathname, query, onSelect }: Readonly<ModuleNavListProps>) {
  const items = moduleNavItems(module, query);
  // Matched against every page, not just this one, so the deepest page wins.
  const active = activeNavPath(
    pathname,
    moduleNavItems(module).map((item) => item.path),
  );

  return (
    <>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ px: 2.5, display: 'block', letterSpacing: 1 }}
      >
        {module.label}
      </Typography>
      <List sx={{ px: 1 }}>
        {items.length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ px: 1.5 }}>
            No page matches “{query}”.
          </Typography>
        )}
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.key}
              selected={active === item.path}
              onClick={() => onSelect(item.path)}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: module.accent }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </>
  );
}
