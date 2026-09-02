import { Chip } from '@/components/ui';

/**
 * Renders a boolean flag column (featured, MVP, urgent…) as a Yes/No chip.
 *
 * Use this for true yes/no flags. Lifecycle states (`isActive`, a submission's status)
 * belong in {@link StatusChip}, which colour-codes them against the shared status map.
 */
export function BoolChip({ value }: Readonly<{ value: boolean }>) {
  return (
    <Chip
      label={value ? 'Yes' : 'No'}
      size="small"
      color={value ? 'success' : 'default'}
      variant="outlined"
    />
  );
}
