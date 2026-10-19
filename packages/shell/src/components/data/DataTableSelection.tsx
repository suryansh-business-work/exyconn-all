import { useT } from '@exyconn/i18n';
import { Checkbox, TableCell } from '@/components/ui';
import type { DataTableBulk } from './useDataTableBulk';

/** The header's checkbox: ticks every row, or clears them once all are ticked. */
export function SelectAllCell({
  bulk,
  rowCount,
}: Readonly<{ bulk: DataTableBulk; rowCount: number }>) {
  const t = useT();
  const some = bulk.selectedIds.length > 0 && !bulk.allSelected;
  return (
    <TableCell padding="checkbox" sx={{ borderColor: 'divider' }}>
      <Checkbox
        size="small"
        checked={bulk.allSelected}
        indeterminate={some}
        disabled={rowCount === 0}
        onChange={bulk.toggleAll}
        slotProps={{ input: { 'aria-label': t('Select all rows') } }}
      />
    </TableCell>
  );
}

/** A row's checkbox; a click on it never also opens the row. */
export function SelectRowCell({ bulk, id }: Readonly<{ bulk: DataTableBulk; id: string }>) {
  const t = useT();
  return (
    <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
      <Checkbox
        size="small"
        checked={bulk.isSelected(id)}
        onChange={() => bulk.toggle(id)}
        slotProps={{ input: { 'aria-label': t('Select row') } }}
      />
    </TableCell>
  );
}
