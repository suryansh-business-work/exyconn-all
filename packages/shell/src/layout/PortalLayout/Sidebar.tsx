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
import { accessibleModules, type ModuleDefinition } from '@/config/modules';
import { env } from '@/config/env';
import type { Role } from '@/auth/roles';
import { useCrossAppNavigate } from '@/hooks/useCrossAppNavigate';
import type { PortalAppKey } from '@/config/apps';
import { PortalSwitcher } from '@/layout/PortalSwitcher';

interface SidebarProps {
  roles: Role[];
  onNavigate?: () => void;
}

/** Lists the modules the current user can open, with nested children + search. */
export function Sidebar({ roles, onNavigate }: SidebarProps) {
  const navigateTo = useCrossAppNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const modules = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = accessibleModules(roles);
    return q ? all.filter((m) => `${m.label} ${m.description}`.toLowerCase().includes(q)) : all;
  }, [roles, query]);

  const go = (app: PortalAppKey, path: string) => {
    navigateTo(app, path);
    onNavigate?.();
  };

  const renderParent = (module: ModuleDefinition) => {
    const Icon = module.icon;
    const childActive = module.children?.some((c) => c.path === pathname) ?? false;
    const expanded = open[module.key] ?? childActive;

    if (!module.children?.length) {
      return (
        <ListItemButton
          key={module.key}
          selected={pathname === module.path}
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
                  selected={pathname === child.path}
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
          placeholder="Search modules…"
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

      <List sx={{ px: 1 }}>
        {modules.length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
            No modules match “{query}”.
          </Typography>
        )}
        {modules.map(renderParent)}
      </List>
    </Box>
  );
}
