import { useMemo, useState } from 'react';
import AppsIcon from '@mui/icons-material/Apps';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Divider, Drawer, InputAdornment, List, TextField, Typography } from '@/components/ui';
import { env } from '@/config/env';
import type { Role } from '@/auth/roles';
import { useCrossAppNavigate } from '@/hooks/useCrossAppNavigate';
import { PortalListItem, type PortalEntry } from './PortalListItem';
import { buildPortalEntries } from './portalEntries';

interface PortalSwitcherProps {
  roles: Role[];
  open: boolean;
  onClose: () => void;
}

/**
 * Cross-portal switcher. Every micro-frontend is its own site on its own
 * subdomain, so this lists the portals the signed-in user can open and jumps
 * straight to them — a full page load when the target is a different app.
 */
export function PortalSwitcher({ roles, open, onClose }: Readonly<PortalSwitcherProps>) {
  const [query, setQuery] = useState('');
  const navigateTo = useCrossAppNavigate();

  const entries = useMemo<PortalEntry[]>(
    () => buildPortalEntries(roles, env.portalApp, query),
    [roles, query],
  );

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
      PaperProps={{ sx: { width: { xs: '100%', sm: 380 } } }}
    >
      <Box sx={{ p: 2, pb: 1.5 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AppsIcon fontSize="small" /> Other Portals
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {entries.length} {entries.length === 1 ? 'portal' : 'portals'} available to you
        </Typography>
      </Box>

      <Box sx={{ px: 2, pb: 1 }}>
        <TextField
          fullWidth
          autoComplete="off"
          placeholder="Search portals…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Box>

      <Divider />

      <List sx={{ px: 1.5, py: 1, overflowY: 'auto' }}>
        {entries.length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ px: 1.5 }}>
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
