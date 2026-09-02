import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import type { Theme } from '@/components/ui';
import { Box, Drawer, Toolbar } from '@/components/ui';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/auth/AuthContext';

const DRAWER_WIDTH = 280;

const drawerPaper = (t: Theme) => ({
  width: DRAWER_WIDTH,
  boxSizing: 'border-box' as const,
  border: 'none',
  borderRight: `1px solid ${t.palette.divider}`,
  background: t.palette.background.paper,
});

/** Responsive portal shell: permanent drawer on desktop, temporary on mobile. */
export function PortalLayout() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  if (!user) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        color: 'text.primary',
        background: 'background.default',
      }}
    >
      <Topbar drawerWidth={DRAWER_WIDTH} onMenuClick={() => setMobileOpen((o) => !o)} />

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={(t) => ({
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': drawerPaper(t),
          })}
        >
          <Sidebar roles={user.roles} onNavigate={() => setMobileOpen(false)} />
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={(t) => ({
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': drawerPaper(t),
          })}
        >
          <Sidebar roles={user.roles} />
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar variant="dense" />
        <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
