import type { SvgIconComponent } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import {
  Chip,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  fontWeight,
  radius,
} from '@/components/ui';
import { IconBubble } from '@/components/dashboard/IconBubble';

/** The switcher's bubble: a step smaller than a stat tile's. */
const SWITCHER_BUBBLE = 36;
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

/** One portal in the switcher: its icon in a pastel bubble of its accent, name, and purpose. */
export function PortalListItem({ entry, onSelect }: Readonly<PortalListItemProps>) {
  return (
    <ListItemButton
      selected={entry.isCurrent}
      aria-current={entry.isCurrent ? 'page' : undefined}
      onClick={() => onSelect(entry)}
      sx={{ borderRadius: `${radius.xl}px`, mb: 0.5, alignItems: 'flex-start', py: 1.5 }}
    >
      <ListItemIcon sx={{ minWidth: 48, mt: 0.5 }}>
        <IconBubble icon={entry.icon} accent={entry.accent} size={SWITCHER_BUBBLE} />
      </ListItemIcon>
      <ListItemText
        primary={entry.label}
        secondary={entry.description}
        slotProps={{
          primary: {
            sx: {
              fontWeight: fontWeight.semibold,
            },
          },
          secondary: { variant: 'caption' },
        }}
      />
      {entry.isCurrent && (
        <Chip size="small" label="Current" icon={<CheckIcon />} sx={{ ml: 1, mt: 0.5 }} />
      )}
    </ListItemButton>
  );
}
