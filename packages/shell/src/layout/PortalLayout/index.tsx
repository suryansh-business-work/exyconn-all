import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import type { Theme } from '@/components/ui';
import { Box, Drawer, Toolbar } from '@/components/ui';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/auth/AuthContext';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';

const DRAWER_WIDTH = 248;
/** Collapsed width: one icon plus its hit area, nothing else. */
const RAIL_WIDTH = 64;

const drawerPaper = (t: Theme, width: number) => ({
  width,
  boxSizing: 'border-box' as const,
  border: 'none',
  borderRight: `1px solid ${t.palette.divider}`,
  background: t.palette.background.paper,
  overflowX: 'hidden' as const,
  transition: t.transitions.create('width', { duration: t.transitions.duration.shorter }),
});

/** Responsive portal shell: permanent drawer on desktop, temporary on mobile. */
export function PortalLayout() {
  const { user } = useAuth();
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

      <Box component="nav" sx={{ width: { md: width }, flexShrink: { md: 0 } }}>
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

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${width}px)` } }}>
        <Toolbar variant="dense" />
        <Box sx={{ p: { xs: 1, md: 1.5 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
