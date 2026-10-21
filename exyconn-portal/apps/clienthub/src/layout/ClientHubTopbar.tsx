import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useT } from '@exyconn/i18n';
import {
  AppBar,
  Box,
  IconButton,
  Text,
  Toolbar,
  Tooltip,
  roundButton,
  tokensFor,
  GLASS_BLUR,
  SOLID_SURFACES,
} from '@exyconn/shell/components/ui';
import { useColorMode } from '@exyconn/shell/theme/ColorModeContext';
import { PAGE_GUTTER, TOPBAR_HEIGHT } from '@exyconn/shell/layout/PortalLayout/metrics';

interface ClientHubTopbarProps {
  drawerWidth: number;
  /** The client company signed in for. */
  company: string;
  name: string;
  onMenuClick: () => void;
  onSignOut: () => void;
}

/**
 * The frosted bar the portals wear: menu on a phone, the client company, who is signed in,
 * theme and sign out.
 */
export function ClientHubTopbar({
  drawerWidth,
  company,
  name,
  onMenuClick,
  onSignOut,
}: Readonly<ClientHubTopbarProps>) {
  const t = useT();
  const { mode, toggle } = useColorMode();
  const themeLabel = mode === 'dark' ? t('Switch to light mode') : t('Switch to dark mode');
  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={(theme) => ({
        width: '100%',
        background: tokensFor(theme.palette.mode).glass.bar,
        backdropFilter: GLASS_BLUR,
        [SOLID_SURFACES]: { background: theme.palette.background.default, backdropFilter: 'none' },
        pt: 'env(safe-area-inset-top)',
      })}
    >
      <Toolbar
        sx={{
          minHeight: { xs: TOPBAR_HEIGHT },
          px: PAGE_GUTTER,
          ml: { md: `${drawerWidth}px` },
          gap: 1,
        }}
      >
        <IconButton
          edge="start"
          onClick={onMenuClick}
          aria-label={t('Open navigation')}
          sx={{ display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Text component="p" size="caption" color="text.secondary" sx={{ m: 0 }}>
            {t('Client Hub')}
          </Text>
          <Text component="p" weight="semibold" noWrap title={company} sx={{ m: 0 }}>
            {company}
          </Text>
        </Box>
        <Text size="sm" weight="medium" noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>
          {name}
        </Text>
        <Tooltip title={themeLabel}>
          <IconButton aria-label={themeLabel} onClick={toggle} sx={(theme) => roundButton(theme)}>
            {mode === 'dark' ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title={t('Sign out')}>
          <IconButton
            aria-label={t('Sign out')}
            onClick={onSignOut}
            sx={(theme) => roundButton(theme)}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
