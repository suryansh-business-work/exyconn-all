import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  borderWidth,
  fontSize,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  fontWeight,
} from '@/components/ui';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useAuth } from '@/auth/AuthContext';
import { useColorMode } from '@/theme/ColorModeContext';
import { TopbarSearch } from './TopbarSearch';
import { NotificationBell } from './NotificationBell';
import { ApprovalsBell } from './ApprovalsBell';
import { PAGE_GUTTER, TOPBAR_HEIGHT } from './metrics';
import { useT } from '@exyconn/i18n';
import { useInstallPrompt } from '@/pwa';

interface TopbarProps {
  drawerWidth: number;
  onMenuClick: () => void;
}

/**
 * Top app bar with global search, the bells and the user account menu — shadcn's site header:
 * the page's own ground over a hairline, with ghost icon buttons (the theme's IconButton).
 */
export function Topbar({ drawerWidth, onMenuClick }: TopbarProps) {
  const { user, signOut } = useAuth();
  const { mode, toggle } = useColorMode();
  const install = useInstallPrompt();
  const t = useT();
  const theme = useTheme();
  const onPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const go = (path: string) => () => {
    setAnchorEl(null);
    navigate(path);
  };

  const handleInstall = () => {
    setAnchorEl(null);
    install.install();
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
        background: t.palette.background.default,
        borderBottom: `${borderWidth.hairline}px solid ${t.palette.divider}`,
        // Installed to a home screen, the app owns the whole screen — including whatever is
        // behind the notch. These insets are zero in a browser tab.
        pt: 'env(safe-area-inset-top)',
        pl: { xs: 'env(safe-area-inset-left)', md: 0 },
        pr: 'env(safe-area-inset-right)',
      })}
    >
      <Toolbar sx={{ minHeight: { xs: TOPBAR_HEIGHT }, px: PAGE_GUTTER }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          aria-label={t('Open navigation')}
          sx={{ mr: 1, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="subtitle2" sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }}>
          Exyconn Track
        </Typography>
        {/* Below md the title is hidden, so this takes its place and keeps the actions on the
            trailing edge instead of bunched up beside the menu button. */}
        <Box aria-hidden sx={{ flexGrow: 1, display: { xs: 'block', md: 'none' } }} />
        {/* Left out on a phone rather than squeezed: at 160px it shows ten characters, and
            the hamburger beside it opens the same list of modules with room to read them. */}
        {user && !onPhone && <TopbarSearch roles={user.roles} />}
        <Box sx={{ textAlign: 'right', mx: 1.5, display: { xs: 'none', sm: 'block' } }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: fontWeight.bold,
              display: 'block',
              lineHeight: 1.3,
            }}
          >
            {user?.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
            }}
          >
            {user?.roles.join(', ')}
          </Typography>
        </Box>
        <ApprovalsBell />
        <NotificationBell />
        <IconButton onClick={toggle} aria-label={t('Toggle colour mode')} sx={{ mr: 1 }}>
          {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label={t('Account menu')}
          sx={{ p: 0 }}
        >
          <Avatar
            src={user?.avatarUrl ?? undefined}
            // The button around it is already named "Account menu".
            alt=""
            aria-hidden
            sx={{ width: 40, height: 40, fontSize: fontSize.md }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem disabled>{user?.email}</MenuItem>
          <MenuItem onClick={go('/profile')}>{t('Profile')}</MenuItem>
          <MenuItem onClick={go('/settings')}>{t('Settings')}</MenuItem>
          {/* Only where the browser has told us it would take: see useInstallPrompt. */}
          {install.available && <MenuItem onClick={handleInstall}>{t('Install app')}</MenuItem>}
          <MenuItem onClick={handleSignOut}>{t('Sign out')}</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
