import { useT } from '@exyconn/i18n';
import { Chip, Flex, Tooltip } from '@/components/ui';
import { StatusChip } from './StatusChip';

interface StatusChipListProps {
  values: readonly string[];
  /** How many chips show before the rest fold into "+N". */
  max?: number;
}

/**
 * A row of status chips that never wraps: the first `max` show, and the rest fold into one
 * "+N" chip whose tooltip (and accessible name) lists them. A grid row has one line's height,
 * so wrapped chips would spill over the row below.
 */
export function StatusChipList({ values, max = 3 }: Readonly<StatusChipListProps>) {
  const t = useT();
  const shown = values.slice(0, max);
  const hidden = values.slice(max);
  const rest = hidden.map((value) => t(value.replaceAll('_', ' '))).join(', ');
  return (
    <Flex
      direction="row"
      spacing={0.5}
      alignItems="center"
      sx={{ flexWrap: 'nowrap', minWidth: 0 }}
    >
      {shown.map((value) => (
        <StatusChip key={value} value={value} />
      ))}
      {hidden.length > 0 && (
        <Tooltip title={rest}>
          <Chip
            size="small"
            variant="outlined"
            label={`+${hidden.length}`}
            // Focusable so the tooltip opens from the keyboard too; read as one labelled item.
            tabIndex={0}
            role="img"
            aria-label={t('{count} more: {list}', { count: hidden.length, list: rest })}
          />
        </Tooltip>
      )}
    </Flex>
  );
}
