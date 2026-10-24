import { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  borderWidth,
  fontSize,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  GLASS_BLUR,
  SOLID_SURFACES,
  tokensFor,
  type Theme,
} from '@/components/ui';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useAuth } from '@/auth/AuthContext';
import { useColorMode } from '@/theme/ColorModeContext';
import { TopbarSearch } from './TopbarSearch';
import { CommandPalette, useCommandPalette } from '../CommandPalette';
import { OrganizationSwitcher } from '../OrganizationSwitcher';
import { NotificationBell } from './NotificationBell';
import { ApprovalsBell } from './ApprovalsBell';
import { AllAppsButton } from './AllAppsButton';
import { PAGE_GUTTER, TOPBAR_HEIGHT } from './metrics';
import { useT } from '@exyconn/i18n';
import { TopbarUser } from './TopbarUser';
import { AccountMenu } from './AccountMenu';
import { currentPortalName } from '@/config/modules';
import { env } from '@/config/env';

/** The topbar's actions: round card-coloured buttons with a hairline, set apart from the glass. */
const roundActions = (t: Theme) => ({
  display: 'flex',
  alignItems: 'center',
  // Tighter on a phone, so the round buttons and the avatar still fit a 360px screen.
  gap: { xs: 0.5, sm: 1 },
  mr: { xs: 0.5, sm: 1 },
  '& .MuiIconButton-root': {
    bgcolor: 'background.paper',
    border: `${borderWidth.hairline}px solid ${t.palette.divider}`,
    '&:hover': { bgcolor: 'background.muted' },
  },
});

interface TopbarProps {
  drawerWidth: number;
  onMenuClick: () => void;
}

/**
 * Top app bar with global search, the bells and the user account menu — shadcn's site header:
 * the page's own ground over a hairline, with ghost icon buttons (the theme's IconButton).
 */
export function Topbar({ drawerWidth, onMenuClick }: Readonly<TopbarProps>) {
  const { user } = useAuth();
  const { mode, toggle } = useColorMode();
  const t = useT();
  const theme = useTheme();
  const onPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const palette = useCommandPalette();

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={(t) => ({
        // Full width, under the docked drawer: the band runs behind the transparent sidebar
        // too, so the page frame's rounded corner sits below one straight edge instead of
        // meeting the square end of a bar that stops at the sidebar.
        width: '100%',
        // Frosted glass over the canvas, dense enough that a page scrolling beneath it never
        // costs its text contrast (contrast.test.ts composites it over body ink). Solid where a
        // person has asked for less transparency or more contrast.
        background: tokensFor(t.palette.mode).glass.bar,
        backdropFilter: GLASS_BLUR,
        [SOLID_SURFACES]: { background: t.palette.background.default, backdropFilter: 'none' },
        // Installed to a home screen, the app owns the whole screen — including whatever is
        // behind the notch. These insets are zero in a browser tab.
        pt: 'env(safe-area-inset-top)',
        pl: { xs: 'env(safe-area-inset-left)', md: 0 },
        pr: 'env(safe-area-inset-right)',
      })}
    >
      <Toolbar
        sx={(t) => ({
          minHeight: { xs: TOPBAR_HEIGHT },
          px: PAGE_GUTTER,
          ml: { md: `${drawerWidth}px` },
          transition: t.transitions.create('margin-left', {
            duration: t.transitions.duration.shorter,
          }),
        })}
      >
        <IconButton
          edge="start"
          onClick={onMenuClick}
          aria-label={t('Open navigation')}
          sx={{ mr: 1, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant="subtitle2"
          noWrap
          sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }}
        >
          {t(currentPortalName(env.portalApp))}
        </Typography>
        {/* Below md the title is hidden, so this takes its place and keeps the actions on the
            trailing edge instead of bunched up beside the menu button. */}
        <Box aria-hidden sx={{ flexGrow: 1, display: { xs: 'block', md: 'none' } }} />
        {user && <OrganizationSwitcher />}
        {user && <TopbarUser name={user.name} roles={user.roles} />}
        <Box sx={roundActions}>
          {user && <TopbarSearch onOpen={() => palette.setOpen(true)} />}
          {/* On a phone the sidebar's "Other Portals" does the same, so the bar keeps its room. */}
          {user && !onPhone && <AllAppsButton />}
          <ApprovalsBell />
          <NotificationBell />
          <IconButton onClick={toggle} aria-label={t('Toggle colour mode')}>
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Box>
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
        <AccountMenu anchorEl={anchorEl} onClose={() => setAnchorEl(null)} />
      </Toolbar>
      {/* Mounted whatever the screen size: the shortcut works on a keyboard attached to a
          phone-width window, and the trigger button is only hidden, not the feature. */}
      <CommandPalette open={palette.open} onClose={() => palette.setOpen(false)} />
    </AppBar>
  );
}
