import SearchIcon from '@mui/icons-material/Search';
import AppsIcon from '@mui/icons-material/Apps';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import {
  Box,
  Divider,
  IconButton,
  InputAdornment,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Toolbar,
  Tooltip,
} from '@/components/ui';
import { env } from '@/config/env';

interface SidebarHeaderProps {
  collapsed: boolean;
  /** Absent on the mobile drawer, where collapsing makes no sense. */
  onToggleCollapse?: () => void;
  onOpenSwitcher: () => void;
  searchPlaceholder: string;
  query: string;
  onQueryChange: (value: string) => void;
}

/** Brand mark, the collapse control, the cross-portal switcher and the nav search. */
export function SidebarHeader({
  collapsed,
  onToggleCollapse,
  onOpenSwitcher,
  searchPlaceholder,
  query,
  onQueryChange,
}: Readonly<SidebarHeaderProps>) {
  return (
    <>
      <Toolbar
        variant="dense"
        sx={{ justifyContent: collapsed ? 'center' : 'space-between', gap: 1, px: 1.5 }}
      >
        <Box component="img" src={env.iconUrl} alt="Exyconn" sx={{ height: 22 }} />
        {onToggleCollapse && !collapsed && (
          <Tooltip title="Collapse sidebar">
            <IconButton size="small" aria-label="Collapse sidebar" onClick={onToggleCollapse}>
              <MenuOpenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>

      {onToggleCollapse && collapsed && (
        <Box sx={{ display: 'grid', placeItems: 'center', pb: 0.5 }}>
          <Tooltip title="Expand sidebar" placement="right">
            <IconButton size="small" aria-label="Expand sidebar" onClick={onToggleCollapse}>
              <MenuOpenIcon fontSize="small" sx={{ transform: 'rotate(180deg)' }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Each portal is its own site, so jumping between them needs an explicit switcher. */}
      <Box sx={{ px: collapsed ? 0.75 : 1, pb: 0.5 }}>
        <Tooltip title={collapsed ? 'Other Portals' : ''} placement="right">
          <ListItemButton
            onClick={onOpenSwitcher}
            sx={{ borderRadius: 1.5, justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36 }}>
              <AppsIcon fontSize="small" />
            </ListItemIcon>
            {!collapsed && (
              <>
                <ListItemText
                  primary="Other Portals"
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                />
                <ChevronRightIcon fontSize="small" color="disabled" />
              </>
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
      <Divider sx={{ mx: 1.5, mb: 0.5 }} />

      {!collapsed && (
        <Box sx={{ px: 1.5, py: 1 }}>
          <TextField
            fullWidth
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}
    </>
  );
}
