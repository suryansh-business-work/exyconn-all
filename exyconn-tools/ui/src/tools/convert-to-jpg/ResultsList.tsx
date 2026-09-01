import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Download from '@mui/icons-material/Download';
import { ConvertItem, formatBytes, outputFileName } from './utils';

interface ResultsListProps {
  items: ConvertItem[];
  onDownload: (item: ConvertItem) => void;
}

const secondaryText = (item: ConvertItem): string => {
  if (item.status === 'error') return item.error ?? 'Conversion failed.';
  if (item.status === 'done' && item.blob) return `${formatBytes(item.file.size)} → ${formatBytes(item.blob.size)}`;
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
              <Tooltip title="Download JPG">
                <IconButton edge="end" size="small" onClick={() => onDownload(item)} aria-label={`Download ${outputFileName(item.file.name)}`}>
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>
            )
          }
        >
          <ListItemText
            primary={<Typography variant="body2" component="span" sx={{ wordBreak: 'break-all' }}>{item.file.name}</Typography>}
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
