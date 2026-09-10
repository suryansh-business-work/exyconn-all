import type { ReactElement } from 'react';
import {
  Avatar,
  Badge,
  borderWidth,
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TRACKER_RADIUS,
  Typography,
} from '@exyconn/ui';
import type { SvgIconComponent } from '@mui/icons-material';
import type { AuthUser } from '@shared/types';
import { NAV_ITEMS, type Section } from '../sections';

interface Props {
  open: boolean;
  section: Section;
  user: AuthUser | null;
  /** Messages waiting for them — the drawer is where the count is worth showing. */
  unreadMessages: number;
  onClose: () => void;
  onSelect: (section: Section) => void;
}

interface NavIconProps {
  icon: SvgIconComponent;
  /** 0 draws no badge at all, which is what an empty inbox should look like. */
  count: number;
}

/** A drawer icon, badged when the section behind it has something waiting. */
function NavIcon({ icon: Icon, count }: Readonly<NavIconProps>): ReactElement {
  return (
    <Badge badgeContent={count} color="error" overlap="circular">
      <Icon fontSize="small" />
    </Badge>
  );
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

/** Temporary drawer holding the app's three sections. */
export default function NavDrawer({
  open,
  section,
  user,
  unreadMessages,
  onClose,
  onSelect,
}: Readonly<Props>): ReactElement {
  const name = user?.name ?? 'Signed in';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: (theme) => ({
          width: 268,
          backgroundColor: theme.palette.background.paper,
          borderRight: `${borderWidth.hairline}px solid ${theme.palette.divider}`,
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
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.id}
            selected={item.id === section}
            onClick={() => onSelect(item.id)}
            sx={{ borderRadius: `${TRACKER_RADIUS}px`, mb: 0.5, py: 1.25 }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <NavIcon icon={item.icon} count={item.id === 'messages' ? unreadMessages : 0} />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              secondary={item.caption}
              primaryTypographyProps={{ variant: 'subtitle2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
