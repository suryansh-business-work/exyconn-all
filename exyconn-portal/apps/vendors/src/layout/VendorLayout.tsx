import { useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApolloClient } from '@apollo/client/react';
import LogoutIcon from '@mui/icons-material/Logout';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartOutlined';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import { useT } from '@exyconn/i18n';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Stack,
  Text,
  Toolbar,
  Tooltip,
  GLASS_BLUR,
  SOLID_SURFACES,
  roundButton,
  tokensFor,
} from '@exyconn/shell/components/ui';
import { pageFrame } from '@exyconn/shell/components/glass/glass';
import { MAIN_CONTENT_ID, SkipLink } from '@exyconn/shell/layout/PortalLayout/SkipLink';
import { PAGE_GUTTER, TOPBAR_HEIGHT } from '@exyconn/shell/layout/PortalLayout/metrics';
import { useFocusOnNavigate } from '@exyconn/shell/layout/PortalLayout/useFocusOnNavigate';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useVendorPortalMeQuery } from '@exyconn/shell/graphql/generated';
import { vendorPass } from '../auth/vendorPass';
import { PATHS } from '../paths';

/** The portal's two sections, in the order a supplier works through them. */
const NAV = [
  { to: PATHS.orders, label: 'Purchase orders', icon: <ShoppingCartIcon fontSize="small" /> },
  { to: PATHS.invoices, label: 'Invoices', icon: <ReceiptIcon fontSize="small" /> },
] as const;

/**
 * The vendor portal's frame: a frosted top bar with the supplier, the two sections and sign
 * out, and each page in the portals' glass frame. It reads the supplier contact's own session
 * (email and one-time code), never a portal login.
 */
export function VendorLayout() {
  const t = useT();
  const navigate = useNavigate();
  const apollo = useApolloClient();
  const { pathname } = useLocation();
  const main = useRef<HTMLElement>(null);
  useFocusOnNavigate(main);
  const { data } = useVendorPortalMeQuery({ fetchPolicy: 'cache-first' });
  const me = data?.vendorPortalMe;

  const signOut = () => {
    vendorPass.clear();
    apollo
      .clearStore()
      .catch((error: unknown) =>
        portalLogger.error('Vendor portal: clearing the cache on sign-out failed', error),
      )
      .finally(() => navigate('/login', { replace: true }));
  };

  return (
    <Box sx={{ minHeight: '100dvh', color: 'text.primary' }}>
      <SkipLink />
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={(theme) => ({
          background: tokensFor(theme.palette.mode).glass.bar,
          backdropFilter: GLASS_BLUR,
          [SOLID_SURFACES]: {
            background: theme.palette.background.default,
            backdropFilter: 'none',
          },
        })}
      >
        <Toolbar
          sx={{ minHeight: { xs: TOPBAR_HEIGHT }, px: PAGE_GUTTER, gap: 1, flexWrap: 'wrap' }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Text component="p" size="caption" color="text.secondary" sx={{ m: 0 }}>
              {t('Vendor Portal')}
            </Text>
            <Text component="p" weight="semibold" noWrap sx={{ m: 0 }}>
              {me?.supplierName ?? ''}
            </Text>
          </Box>
          <Stack
            component="nav"
            direction="row"
            spacing={0.5}
            aria-label={t('Vendor portal sections')}
          >
            {NAV.map((item) => {
              const selected = pathname.startsWith(item.to);
              return (
                <Button
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  startIcon={item.icon}
                  variant={selected ? 'contained' : 'text'}
                  aria-current={selected ? 'page' : undefined}
                  size="small"
                >
                  {t(item.label)}
                </Button>
              );
            })}
          </Stack>
          <Text size="sm" weight="medium" noWrap sx={{ display: { xs: 'none', md: 'block' } }}>
            {me?.name ?? ''}
          </Text>
          <Tooltip title={t('Sign out')}>
            <IconButton
              aria-label={t('Sign out')}
              onClick={signOut}
              sx={(theme) => roundButton(theme)}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        id={MAIN_CONTENT_ID}
        ref={main}
        tabIndex={-1}
        sx={[{ px: PAGE_GUTTER, py: { xs: 1, md: 3 }, m: { md: 2 } }, pageFrame]}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
