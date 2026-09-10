import { useMemo, useState } from 'react';
import AppsIcon from '@mui/icons-material/Apps';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Divider, Drawer, InputAdornment, List, TextField, Typography } from '@/components/ui';
import { env } from '@/config/env';
import type { Role } from '@/auth/roles';
import { useCrossAppNavigate } from '@/hooks/useCrossAppNavigate';
import { PortalListItem, type PortalEntry } from './PortalListItem';
import { allPortalEntries, buildPortalEntries } from './portalEntries';

interface PortalSwitcherProps {
  /** Roles of the signed-in user; `null` on the login screen, where every portal is listed. */
  roles: Role[] | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Cross-portal switcher. Every micro-frontend is its own site on its own
 * subdomain, so this lists the portals the user can open and jumps straight to
 * them — a full page load when the target is a different app. Signed out it
 * lists them all: the target portal's own gate decides whether the visitor is
 * let in on the shared session cookie or shown its login screen.
 */
export function PortalSwitcher({ roles, open, onClose }: Readonly<PortalSwitcherProps>) {
  const [query, setQuery] = useState('');
  const navigateTo = useCrossAppNavigate();

  const entries = useMemo<PortalEntry[]>(
    () =>
      roles
        ? buildPortalEntries(roles, env.portalApp, query)
        : allPortalEntries(env.portalApp, query),
    [roles, query],
  );

  const noun = entries.length === 1 ? 'portal' : 'portals';
  const caption = roles
    ? `${entries.length} ${noun} available to you`
    : `${entries.length} ${noun} — sign in to open one`;

  const handleSelect = (entry: PortalEntry) => {
    onClose();
    if (entry.isCurrent) return;
    navigateTo(entry.app, entry.path);
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      slotProps={{
        paper: { sx: { width: { xs: '100%', sm: 380 } } }
      }}
    >
      <Box sx={{ p: 2, pb: 1.5 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AppsIcon fontSize="small" /> Other Portals
        </Typography>
        <Typography variant="caption" sx={{
          color: "text.secondary"
        }}>
          {caption}
        </Typography>
      </Box>

      <Box sx={{ px: 2, pb: 1 }}>
        <TextField
          fullWidth
          autoComplete="off"
          placeholder="Search portals…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }
          }}
        />
      </Box>

      <Divider />

      <List sx={{ px: 1.5, py: 1, overflowY: 'auto' }}>
        {entries.length === 0 && (
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              px: 1.5
            }}>
            No portal matches “{query}”.
          </Typography>
        )}
        {entries.map((entry) => (
          <PortalListItem key={entry.key} entry={entry} onSelect={handleSelect} />
        ))}
      </List>
    </Drawer>
  );
}
