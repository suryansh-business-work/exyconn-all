import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { Theme } from '@/components/ui';
import { borderWidth, Box, Drawer, Toolbar } from '@/components/ui';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { PAGE_GUTTER, TOPBAR_HEIGHT } from './metrics';
import { useAuth } from '@/auth/AuthContext';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { PageErrorBoundary } from '@/logging/PageErrorBoundary';

/** Wide enough that a page like "Onboarding Templates" is read, not truncated. */
const DRAWER_WIDTH = 288;
/** Collapsed width: one icon plus its hit area, nothing else. */
const RAIL_WIDTH = 64;

const drawerPaper = (t: Theme, width: number) => ({
  width,
  boxSizing: 'border-box' as const,
  border: 'none',
  borderRight: `${borderWidth.hairline}px solid ${t.palette.divider}`,
  background: t.palette.background.paper,
  overflowX: 'hidden' as const,
  transition: t.transitions.create('width', { duration: t.transitions.duration.shorter }),
});

/** Responsive portal shell: permanent drawer on desktop, temporary on mobile. */
export function PortalLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  if (!user) return null;

  const width = collapsed ? RAIL_WIDTH : DRAWER_WIDTH;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        color: 'text.primary',
        background: 'background.default',
      }}
    >
      <Topbar drawerWidth={width} onMenuClick={() => setMobileOpen((o) => !o)} />

      <Box
        component="nav"
        aria-label="Portal pages"
        sx={{ width: { md: width }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={(t) => ({
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': drawerPaper(t, DRAWER_WIDTH),
          })}
        >
          <Sidebar roles={user.roles} onNavigate={() => setMobileOpen(false)} />
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={(t) => ({
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': drawerPaper(t, width),
          })}
        >
          <Sidebar roles={user.roles} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
        </Drawer>
      </Box>

      {/* `minWidth: 0` is what keeps a wide table inside the page: without it this flex
          child grows to its content and scrolls the whole document sideways, out from under
          the fixed topbar. Anything genuinely wider scrolls inside its own container. */}
      <Box
        component="main"
        sx={{ flexGrow: 1, minWidth: 0, width: { md: `calc(100% - ${width}px)` } }}
      >
        {/* Spacer the height of the fixed topbar. */}
        <Toolbar sx={{ minHeight: { xs: TOPBAR_HEIGHT } }} />
        <Box
          sx={{
            px: PAGE_GUTTER,
            pt: 0.5,
            // Clear of the home indicator on an installed app; zero in a browser tab.
            pb: { xs: 'calc(env(safe-area-inset-bottom) + 12px)', md: 2 },
          }}
        >
          {/* Keyed by path: a crashed page leaves the sidebar working, and navigating clears it. */}
          <PageErrorBoundary key={pathname}>
            <Outlet />
          </PageErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}
