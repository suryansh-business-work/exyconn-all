import { useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { Theme } from '@/components/ui';
import { Box, Drawer, enterAnimation, Toolbar } from '@/components/ui';
import { pageFrame } from '@/components/glass/glass';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { PAGE_GUTTER, TOPBAR_HEIGHT } from './metrics';
import { useAuth } from '@/auth/AuthContext';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { PageErrorBoundary } from '@/logging/PageErrorBoundary';
import { useT } from '@exyconn/i18n';
import { MAIN_CONTENT_ID, SkipLink } from './SkipLink';
import { BrandFavicon } from './BrandFavicon';
import { useFocusOnNavigate } from './useFocusOnNavigate';
import { DockHost } from '@/components/compose-dock';
import { MailboxConnectReturn } from '@/components/email';

/** Wide enough that a page like "Onboarding Templates" is read, not truncated. */
const DRAWER_WIDTH = 288;
/** Collapsed width: one icon plus its hit area, nothing else. */
const RAIL_WIDTH = 64;

/**
 * The navigation column. Docked, it is no surface at all: its pill rows sit straight on the
 * pastel canvas beside the frosted page frame. Sliding over the page on a phone, it is the
 * solid sidebar colour, because the page beneath would otherwise show through its text.
 */
const drawerPaper = (t: Theme, width: number, floating: boolean) => ({
  width,
  boxSizing: 'border-box' as const,
  border: 'none',
  background: floating ? t.palette.background.sidebar : 'transparent',
  overflowX: 'hidden' as const,
  transition: t.transitions.create('width', { duration: t.transitions.duration.shorter }),
});

/**
 * The icon rail scrolls without a visible scrollbar. A classic (non-overlay) scrollbar would
 * take 15px of its 64, pushing every icon and the current page's pill off-centre against the
 * rail's left edge. Wheel, touch and keyboard focus still scroll it.
 */
const railScroll = {
  scrollbarWidth: 'none' as const,
  '&::-webkit-scrollbar': { display: 'none' },
};

/** Responsive portal shell: permanent drawer on desktop, temporary on mobile. */
export function PortalLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const t = useT();
  const main = useRef<HTMLElement>(null);
  useFocusOnNavigate(main);

  if (!user) return null;

  const width = collapsed ? RAIL_WIDTH : DRAWER_WIDTH;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        color: 'text.primary',
        // Transparent, so the theme's pastel canvas on <body> shows round the frame.
        background: 'transparent',
      }}
    >
      <SkipLink />
      <BrandFavicon />
      <MailboxConnectReturn />
      <Topbar drawerWidth={width} onMenuClick={() => setMobileOpen((o) => !o)} />

      <Box
        component="nav"
        aria-label={t('Portal pages')}
        sx={{ width: { md: width }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={(t) => ({
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': drawerPaper(t, DRAWER_WIDTH, true),
          })}
        >
          <Sidebar
            roles={user.roles}
            planRoles={user.planRoles}
            onNavigate={() => setMobileOpen(false)}
          />
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={(t) => ({
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': collapsed
              ? { ...drawerPaper(t, width, false), ...railScroll }
              : drawerPaper(t, width, false),
          })}
        >
          <Sidebar
            roles={user.roles}
            planRoles={user.planRoles}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapsed}
          />
        </Drawer>
      </Box>

      {/* `minWidth: 0` is what keeps a wide table inside the page: without it this flex
          child grows to its content and scrolls the whole document sideways, out from under
          the fixed topbar. Anything genuinely wider scrolls inside its own container. */}
      <Box
        component="main"
        id={MAIN_CONTENT_ID}
        ref={main}
        // Focusable from the skip link and on navigation only — not a tab stop of its own.
        tabIndex={-1}
        sx={{ flexGrow: 1, minWidth: 0, width: { md: `calc(100% - ${width}px)` } }}
      >
        {/* Spacer the height of the fixed topbar. */}
        <Toolbar sx={{ minHeight: { xs: TOPBAR_HEIGHT } }} />
        <Box
          sx={[
            {
              px: PAGE_GUTTER,
              pt: { xs: 1, md: 3 },
              // Clear of the home indicator on an installed app; zero in a browser tab.
              pb: { xs: 'calc(env(safe-area-inset-bottom) + 16px)', md: 3 },
              // The frame fills the screen below the topbar, keeping a gutter of canvas round it.
              mr: { md: 2 },
              mb: { md: 2 },
              minHeight: { md: `calc(100vh - ${TOPBAR_HEIGHT}px - 16px)` },
            },
            pageFrame,
          ]}
        >
          {/* Keyed by path: a crashed page leaves the sidebar working, and navigating clears it. */}
          <PageErrorBoundary key={pathname}>
            {/* Remounted with the boundary on every navigation, so each page fades in. */}
            <Box sx={{ animation: enterAnimation.page }}>
              <Outlet />
            </Box>
          </PageErrorBoundary>
        </Box>
      </Box>
      {/* Email (and the CRM's call and text) windows float over every page and survive
          navigation; a failing window does not take the page down with it. */}
      <PageErrorBoundary>
        <DockHost />
      </PageErrorBoundary>
    </Box>
  );
}
