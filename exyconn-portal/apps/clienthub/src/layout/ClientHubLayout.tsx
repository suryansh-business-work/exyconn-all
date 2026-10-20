import { useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useApolloClient } from '@apollo/client/react';
import { useT } from '@exyconn/i18n';
import { Box, Drawer, Toolbar, type Theme } from '@exyconn/shell/components/ui';
import { pageFrame } from '@exyconn/shell/components/glass/glass';
import { MAIN_CONTENT_ID, SkipLink } from '@exyconn/shell/layout/PortalLayout/SkipLink';
import { PAGE_GUTTER, TOPBAR_HEIGHT } from '@exyconn/shell/layout/PortalLayout/metrics';
import { useFocusOnNavigate } from '@exyconn/shell/layout/PortalLayout/useFocusOnNavigate';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useClientHubMeQuery } from '@exyconn/shell/graphql/generated';
import { clientPass } from '../auth/clientPass';
import { ClientHubSidebar } from './ClientHubSidebar';
import { ClientHubTopbar } from './ClientHubTopbar';

const DRAWER_WIDTH = 260;

/** Docked, the sidebar sits on the canvas; over the page on a phone it is solid. */
const drawerPaper = (theme: Theme, floating: boolean) => ({
  width: DRAWER_WIDTH,
  boxSizing: 'border-box' as const,
  border: 'none',
  background: floating ? theme.palette.background.sidebar : 'transparent',
});

/**
 * The client hub's frame, in the portals' clothes: brand and sections in a sidebar, a frosted
 * topbar, and each page in the glass frame. Built for a client rather than an employee — it
 * reads the client's own session (email and one-time code), never a portal login.
 */
export function ClientHubLayout() {
  const t = useT();
  const navigate = useNavigate();
  const apollo = useApolloClient();
  const main = useRef<HTMLElement>(null);
  useFocusOnNavigate(main);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data } = useClientHubMeQuery({ fetchPolicy: 'cache-first' });
  const me = data?.clientHubMe;
  const company = me?.company || me?.clientName || '';

  const signOut = () => {
    clientPass.clear();
    apollo
      .clearStore()
      .catch((error: unknown) =>
        portalLogger.error('Client hub: clearing the cache on sign-out failed', error),
      )
      .finally(() => navigate('/login', { replace: true }));
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', color: 'text.primary' }}>
      <SkipLink />
      <ClientHubTopbar
        drawerWidth={DRAWER_WIDTH}
        name={me?.name ?? ''}
        onMenuClick={() => setMobileOpen((open) => !open)}
        onSignOut={signOut}
      />
      <Box
        component="nav"
        aria-label={t('Client hub sections')}
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={(theme) => ({
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': drawerPaper(theme, true),
          })}
        >
          <ClientHubSidebar company={company} onNavigate={() => setMobileOpen(false)} />
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={(theme) => ({
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': drawerPaper(theme, false),
          })}
        >
          <ClientHubSidebar company={company} />
        </Drawer>
      </Box>
      <Box
        component="main"
        id={MAIN_CONTENT_ID}
        ref={main}
        tabIndex={-1}
        sx={{ flexGrow: 1, minWidth: 0, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}
      >
        <Toolbar sx={{ minHeight: { xs: TOPBAR_HEIGHT } }} />
        <Box
          sx={[
            {
              px: PAGE_GUTTER,
              pt: { xs: 1, md: 3 },
              pb: { xs: 'calc(env(safe-area-inset-bottom) + 16px)', md: 3 },
              mr: { md: 2 },
              mb: { md: 2 },
              minHeight: { md: `calc(100vh - ${TOPBAR_HEIGHT}px - 16px)` },
            },
            pageFrame,
          ]}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
