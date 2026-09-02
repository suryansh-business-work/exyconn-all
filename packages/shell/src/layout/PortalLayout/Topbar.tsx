import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@/components/ui';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useAuth } from '@/auth/AuthContext';
import { useColorMode } from '@/theme/ColorModeContext';
import { TopbarSearch } from './TopbarSearch';

interface TopbarProps {
  drawerWidth: number;
  onMenuClick: () => void;
}

/** Top app bar with global search and the user account menu. */
export function Topbar({ drawerWidth, onMenuClick }: TopbarProps) {
  const { user, signOut } = useAuth();
  const { mode, toggle } = useColorMode();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const go = (path: string) => () => {
    setAnchorEl(null);
    navigate(path);
  };

  const handleSignOut = () => {
    setAnchorEl(null);
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={(t) => ({
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        background: t.palette.background.paper,
        borderBottom: `1px solid ${t.palette.divider}`,
      })}
    >
      <Toolbar variant="dense">
        <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 2, display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }}>
          Exyconn Track
        </Typography>
        {user && <TopbarSearch roles={user.roles} />}
        <Box sx={{ textAlign: 'right', ml: 2, mr: 2, display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="body2" fontWeight={600} sx={{ display: 'block' }}>
            {user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {user?.roles.join(', ')}
          </Typography>
        </Box>
        <IconButton onClick={toggle} aria-label="toggle color mode" sx={{ mr: 0.5 }}>
          {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="account menu">
          <Avatar
            src={user?.avatarUrl ?? undefined}
            sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem disabled>{user?.email}</MenuItem>
          <MenuItem onClick={go('/profile')}>Profile</MenuItem>
          <MenuItem onClick={go('/settings')}>Settings</MenuItem>
          <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
