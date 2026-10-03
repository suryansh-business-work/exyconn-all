import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import { alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import Logo from '../../Logo/Logo';
import { HUB_PATH } from '../../../seo/site';
import { fonts } from '../../../theme/tokens';
import { gutterSx, iconButtonSx, SHELL_MAX_WIDTH } from '../styles';
import CategoryMenu from './CategoryMenu';
import HeaderActions from './HeaderActions';
import HeaderSearch from './HeaderSearch';
import NavDrawer from './NavDrawer';

interface AppHeaderProps {
  /** The hub has its own hero search, so it hides the header one. */
  showSearch?: boolean;
}

/** Sticky frosted header shared by the hub, category pages and every tool. */
const AppHeader: React.FC<Readonly<AppHeaderProps>> = ({ showSearch = true }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={(theme) => ({
        bgcolor: alpha(theme.palette.background.default, 0.78),
        backdropFilter: 'blur(14px) saturate(150%)',
        borderBottom: 1,
        borderColor: 'divider',
        color: 'text.primary',
      })}
    >
      <Toolbar disableGutters sx={{ minHeight: { xs: 60, md: 64 } }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: SHELL_MAX_WIDTH,
            mx: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, md: 2 },
            ...gutterSx,
          }}
        >
          <Box
            component={RouterLink}
            to={HUB_PATH}
            aria-label="Exyconn Tools home"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              minHeight: 44,
              color: 'inherit',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <Logo height={26} />
            <Box
              component="span"
              sx={{
                fontFamily: fonts.mono,
                fontSize: '0.7rem',
                letterSpacing: '0.18em',
                color: 'text.secondary',
                display: { xs: 'none', sm: 'inline' },
              }}
            >
              / TOOLS
            </Box>
          </Box>

          <Box
            component="nav"
            aria-label="Main"
            sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, ml: 2 }}
          >
            <Button color="inherit" component={RouterLink} to={HUB_PATH} sx={{ minHeight: 44, px: 1.5 }}>
              All tools
            </Button>
            <CategoryMenu />
          </Box>

          <Box sx={{ flex: 1 }} />
          {showSearch && (
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <HeaderSearch />
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HeaderActions />
            <IconButton
              aria-label="Open navigation"
              onClick={() => setDrawerOpen(true)}
              sx={{ ...iconButtonSx, display: { xs: 'inline-flex', md: 'none' } }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Toolbar>
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </AppBar>
  );
};

export default AppHeader;
