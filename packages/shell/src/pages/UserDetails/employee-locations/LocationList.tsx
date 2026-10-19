import { useFormatters, useT } from '@exyconn/i18n';
import { Box, List, ListItemButton, ListItemText } from '@/components/ui';
import { KIND_LABEL, SOURCE_LABEL, type LocationPin } from './locations.types';

const BADGE = 28;

interface LocationListProps {
  pins: readonly LocationPin[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** The day's pins as a list beside the map, numbered as the markers are. */
export function LocationList({ pins, selectedId, onSelect }: Readonly<LocationListProps>) {
  const t = useT();
  const { formatTime } = useFormatters();
  return (
    // Every row is a button, so the scrolled list is reachable by keyboard as it is.
    <Box sx={{ maxHeight: { md: 360 }, overflowY: 'auto' }}>
      <List dense disablePadding>
        {pins.map((pin, index) => (
          <ListItemButton
            key={pin.id}
            selected={pin.id === selectedId}
            onClick={() => onSelect(pin.id)}
          >
            <Box
              aria-hidden
              sx={{
                width: BADGE,
                height: BADGE,
                mr: 1.5,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                typography: 'caption',
              }}
            >
              {index + 1}
            </Box>
            <ListItemText
              primary={formatTime(pin.capturedAt)}
              secondary={`${t(KIND_LABEL[pin.kind])} · ${t(SOURCE_LABEL[pin.source])}`}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
