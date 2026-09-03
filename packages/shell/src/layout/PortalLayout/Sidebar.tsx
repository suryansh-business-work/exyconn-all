import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AppsIcon from '@mui/icons-material/Apps';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Collapse, Divider } from '@/components/ui';
import {
  Box,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Toolbar,
  Typography,
} from '@/components/ui';
import type { ModuleDefinition } from '@/config/modules';
import { env } from '@/config/env';
import type { Role } from '@/auth/roles';
import { useCrossAppNavigate } from '@/hooks/useCrossAppNavigate';
import type { PortalAppKey } from '@/config/apps';
import { PortalSwitcher } from '@/layout/PortalSwitcher';
import { navModules } from './moduleNav';
import { activeNavPath } from './activeNavPath';
import { ModuleNavList } from './ModuleNavList';

interface SidebarProps {
  roles: Role[];
  onNavigate?: () => void;
}

/**
 * Navigation for this portal. The hub lists every module the roles can open; a
 * module app shows only its own pages, because every other portal is one click
 * away in the switcher above.
 */
export function Sidebar({ roles, onNavigate }: SidebarProps) {
  const navigateTo = useCrossAppNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
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

  const renderParent = (module: ModuleDefinition) => {
    const Icon = module.icon;
    const childActive = module.children?.some((c) => c.path === active) ?? false;
    const expanded = open[module.key] ?? childActive;

    if (!module.children?.length) {
      return (
        <ListItemButton
          key={module.key}
          selected={active === module.path}
          onClick={() => go(module.key, module.path)}
          sx={{ borderRadius: 2, mb: 0.5 }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: module.accent }}>
            <Icon />
          </ListItemIcon>
          <ListItemText primary={module.label} secondary={module.description} />
        </ListItemButton>
      );
    }

    return (
      <Box key={module.key}>
        <ListItemButton
          onClick={() => setOpen((prev) => ({ ...prev, [module.key]: !expanded }))}
          sx={{ borderRadius: 2, mb: 0.5 }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: module.accent }}>
            <Icon />
          </ListItemIcon>
          <ListItemText primary={module.label} secondary={module.description} />
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List disablePadding sx={{ pl: 2 }}>
            {module.children.map((child) => {
              const ChildIcon = child.icon;
              return (
                <ListItemButton
                  key={child.key}
                  selected={active === child.path}
                  onClick={() => go(module.key, child.path)}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: module.accent }}>
                    <ChildIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={child.label} />
                </ListItemButton>
              );
            })}
          </List>
        </Collapse>
      </Box>
    );
  };

  return (
    <Box>
      <Toolbar variant="dense">
        <Box component="img" src={env.iconUrl} alt="Exyconn" sx={{ height: 26 }} />
      </Toolbar>

      {/* Each portal is its own site, so jumping between them needs an explicit switcher. */}
      <Box sx={{ px: 1, pb: 1 }}>
        <ListItemButton onClick={() => setSwitcherOpen(true)} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <AppsIcon />
          </ListItemIcon>
          <ListItemText primary="Other Portals" secondary="Switch to another portal" />
          <ChevronRightIcon fontSize="small" color="disabled" />
        </ListItemButton>
      </Box>
      <Divider sx={{ mx: 1.5, mb: 1 }} />

      <PortalSwitcher roles={roles} open={switcherOpen} onClose={() => setSwitcherOpen(false)} />

      <Box sx={{ px: 1.5, pb: 1 }}>
        <TextField
          fullWidth
          placeholder={isHub ? 'Search modules…' : 'Search pages…'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      {isHub ? (
        <List sx={{ px: 1 }}>
          {modules.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
              No modules match “{query}”.
            </Typography>
          )}
          {modules.map(renderParent)}
        </List>
      ) : (
        modules.map((module) => (
          <ModuleNavList
            key={module.key}
            module={module}
            pathname={pathname}
            query={query}
            onSelect={(path) => go(module.key, path)}
          />
        ))
      )}
    </Box>
  );
}
