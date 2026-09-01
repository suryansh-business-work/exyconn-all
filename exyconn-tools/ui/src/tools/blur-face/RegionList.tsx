import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Delete from '@mui/icons-material/Delete';
import { Region } from './utils';

interface RegionListProps {
  regions: readonly Region[];
  onRemove: (id: string) => void;
}

export default function RegionList({ regions, onRemove }: Readonly<RegionListProps>) {
  if (regions.length === 0) return null;
  return (
    <List dense disablePadding>
      {regions.map((region, index) => (
        <ListItem
          key={region.id}
          divider
          disableGutters
          secondaryAction={
            <Tooltip title="Remove region">
              <IconButton edge="end" size="small" aria-label={`Remove region ${index + 1}`} onClick={() => onRemove(region.id)}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        >
          <ListItemText
            primary={`Region ${index + 1}`}
            secondary={`${region.width} × ${region.height} px at (${region.x}, ${region.y})`}
          />
        </ListItem>
      ))}
    </List>
  );
}
