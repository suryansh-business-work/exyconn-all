import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Collapse } from '@/components/ui';
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

interface SidebarProps {
  roles: Role[];
  onNavigate?: () => void;
}

/** Lists the modules the current user can open, with nested children + search. */
export function Sidebar({ roles, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const modules = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = accessibleModules(roles);
    return q ? all.filter((m) => `${m.label} ${m.description}`.toLowerCase().includes(q)) : all;
  }, [roles, query]);

  const go = (path: string) => {
    navigate(path);
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
          onClick={() => go(module.path)}
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
                  onClick={() => go(child.path)}
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
