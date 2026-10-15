import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloseIcon from '@mui/icons-material/Close';
import { useT } from '@exyconn/i18n';
import {
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
} from '@exyconn/shell/components/ui';
import type { ColumnChoice } from '../buildColumns';
import { choiceLabel } from './choiceLabel';

interface ColumnOrderListProps {
  columns: readonly ColumnChoice[];
  onMove: (index: number, offset: -1 | 1) => void;
  onRemove: (id: string) => void;
}

/** The chosen columns in the order the grid shows them, each with up/down/remove buttons. */
export function ColumnOrderList({ columns, onMove, onRemove }: Readonly<ColumnOrderListProps>) {
  const t = useT();
  const last = columns.length - 1;
  return (
    <List dense subheader={<ListSubheader disableSticky>{t('Shown, in order')}</ListSubheader>}>
      {columns.map((column, index) => {
        const label = choiceLabel(t, column);
        return (
          <ListItem
            key={column.id}
            secondaryAction={
              <>
                <IconButton
                  size="small"
                  disabled={index === 0}
                  onClick={() => onMove(index, -1)}
                  aria-label={t('Move {column} up', { column: label })}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={index === last}
                  onClick={() => onMove(index, 1)}
                  aria-label={t('Move {column} down', { column: label })}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={columns.length === 1}
                  onClick={() => onRemove(column.id)}
                  aria-label={t('Hide {column}', { column: label })}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            }
          >
            <ListItemText primary={label} />
          </ListItem>
        );
      })}
    </List>
  );
}
