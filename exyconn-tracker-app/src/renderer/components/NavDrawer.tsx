import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import type { AuthUser } from '@shared/types';
import { NAV_ITEMS, type Section } from '../sections';
import { glass } from '../theme';

interface Props {
  open: boolean;
  section: Section;
  user: AuthUser | null;
  onClose: () => void;
  onSelect: (section: Section) => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}

/** Temporary glass drawer holding the app's three sections. */
export default function NavDrawer({
  open,
  section,
  user,
  onClose,
  onSelect,
}: Readonly<Props>): JSX.Element {
  const name = user?.name ?? 'Signed in';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: (theme) => ({
          ...glass(theme, 0.12),
          borderRadius: 0,
          borderTop: 'none',
          borderBottom: 'none',
          borderLeft: 'none',
          width: 268,
          backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.18)}, transparent 45%)`,
        }),
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 2.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontWeight: 700 }}>
          {initials(name)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {user?.email ?? ''}
          </Typography>
        </Box>
      </Stack>
      <Divider />
      <List sx={{ p: 1.5 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.id}
              selected={item.id === section}
              onClick={() => onSelect(item.id)}
              sx={{ borderRadius: '4px', mb: 0.5, py: 1.25 }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={item.caption}
                primaryTypographyProps={{ variant: 'subtitle2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}
