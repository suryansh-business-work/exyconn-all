import type { SvgIconComponent } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import { Box, Chip, ListItemButton, ListItemIcon, ListItemText } from '@/components/ui';
import type { PortalAppKey } from '@/config/apps';

export interface PortalEntry {
  key: string;
  label: string;
  description: string;
  /** Micro-frontend that serves this portal, and the path to land on. */
  app: PortalAppKey;
  path: string;
  icon: SvgIconComponent;
  accent: string;
  isCurrent: boolean;
}

interface PortalListItemProps {
  entry: PortalEntry;
  onSelect: (entry: PortalEntry) => void;
}

/** One portal in the switcher: accent-tinted icon, name, and what it is for. */
export function PortalListItem({ entry, onSelect }: Readonly<PortalListItemProps>) {
  const Icon = entry.icon;

  return (
    <ListItemButton
      selected={entry.isCurrent}
      onClick={() => onSelect(entry)}
      sx={{ borderRadius: 2, mb: 0.5, alignItems: 'flex-start', py: 1.25 }}
    >
      <ListItemIcon sx={{ minWidth: 44, mt: 0.25 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            bgcolor: entry.accent,
          }}
        >
          <Icon fontSize="small" />
        </Box>
      </ListItemIcon>
      <ListItemText
        primary={entry.label}
        secondary={entry.description}
        primaryTypographyProps={{ fontWeight: 600 }}
        secondaryTypographyProps={{ variant: 'caption' }}
      />
      {entry.isCurrent && (
        <Chip size="small" label="Current" icon={<CheckIcon />} sx={{ ml: 1, mt: 0.25 }} />
      )}
    </ListItemButton>
  );
}
