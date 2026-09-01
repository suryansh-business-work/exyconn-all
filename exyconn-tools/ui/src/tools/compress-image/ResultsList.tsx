import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Download from '@mui/icons-material/Download';
import { CompressItem, formatBytes, computeSavedPercent } from './utils';

interface ResultsListProps {
  items: CompressItem[];
  onDownload: (item: CompressItem) => void;
}

const savedChip = (item: CompressItem) => {
  if (item.status !== 'done' || item.outputBytes === undefined) return null;
  const saved = computeSavedPercent(item.file.size, item.outputBytes);
  const color = saved > 0 ? 'success' : 'default';
  return <Chip size="small" color={color} label={`${saved}% saved`} sx={{ ml: 1 }} />;
};

const secondaryText = (item: CompressItem): string => {
  if (item.status === 'error') return item.error ?? 'Compression failed.';
  if (item.status === 'done' && item.outputBytes !== undefined) {
    return `${formatBytes(item.file.size)} → ${formatBytes(item.outputBytes)}`;
  }
  return formatBytes(item.file.size);
};

export default function ResultsList({ items, onDownload }: Readonly<ResultsListProps>) {
  if (items.length === 0) return null;
  return (
    <List dense>
      {items.map((item) => (
        <ListItem
          key={item.id}
          divider
          secondaryAction={
            item.status === 'done' && (
              <Tooltip title="Download">
                <IconButton edge="end" size="small" onClick={() => onDownload(item)} aria-label={`Download ${item.file.name}`}>
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>
            )
          }
        >
          <ListItemText
            primary={
              <Typography variant="body2" component="span" sx={{ wordBreak: 'break-all' }}>
                {item.file.name}
                {savedChip(item)}
              </Typography>
            }
            secondary={
              <Typography variant="caption" color={item.status === 'error' ? 'error' : 'text.secondary'} component="span">
                {secondaryText(item)}
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
