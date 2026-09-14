import { useT } from '@exyconn/i18n';
import { MenuItem, TextField } from '@exyconn/shell/components/ui';

/** A board column, as far as moving a ticket into it needs. */
export interface TicketBoardColumn {
  id: string;
  name: string;
}

interface TicketColumnSelectProps {
  columns: TicketBoardColumn[];
  value: string;
  onChange: (columnId: string) => void;
}

/** Moves a ticket to another column with one choice — the alternative to dragging its card. */
export function TicketColumnSelect({
  columns,
  value,
  onChange,
}: Readonly<TicketColumnSelectProps>) {
  const t = useT();
  return (
    <TextField
      select
      size="small"
      label={t('Column')}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      sx={{ minWidth: 200, mb: 2 }}
    >
      {columns.map((column) => (
        <MenuItem key={column.id} value={column.id}>
          {column.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
