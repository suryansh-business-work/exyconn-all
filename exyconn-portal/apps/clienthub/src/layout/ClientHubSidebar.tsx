import { NavLink, useLocation } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  radius,
} from '@exyconn/shell/components/ui';
import { env } from '@exyconn/shell/config/env';
import { TOPBAR_HEIGHT } from '@exyconn/shell/layout/PortalLayout/metrics';
import { CLIENT_NAV } from './clienthub.nav';
import { useClientBrandLogo } from './useClientBrandLogo';

interface ClientHubSidebarProps {
  /** Closes the phone drawer after a pick. */
  onNavigate?: () => void;
}

/** The brand and the hub's sections as the portals' pill rows. */
export function ClientHubSidebar({ onNavigate }: Readonly<ClientHubSidebarProps>) {
  const t = useT();
  const logo = useClientBrandLogo();
  const { pathname } = useLocation();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ minHeight: { xs: TOPBAR_HEIGHT }, px: 2 }}>
        <Box
          component="img"
          src={logo}
          alt={env.logoAlt}
          sx={{ height: 26, maxWidth: 168, objectFit: 'contain' }}
        />
      </Toolbar>
      <List component="div" sx={{ px: 1 }}>
        {CLIENT_NAV.map((item) => {
          const selected = pathname.startsWith(item.to);
          return (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              selected={selected}
              aria-current={selected ? 'page' : undefined}
              onClick={onNavigate}
              sx={{ borderRadius: `${radius.pill}px`, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: selected ? undefined : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={t(item.label)} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
