import { ToggleButton, ToggleButtonGroup } from '@exyconn/shell/components/ui';
import { FilterOp, SupportStatus, type TableFilterInput } from '@exyconn/shell/graphql/generated';

export type QuickFilter = 'all' | 'unassigned' | 'mine' | 'open';

const OPTIONS: Array<{ value: QuickFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'mine', label: 'Mine' },
  { value: 'open', label: 'Open' },
];

/** The server-side filters one quick-filter choice adds to every page request. */
export function quickFilters(filter: QuickFilter, userId: string): TableFilterInput[] {
  if (filter === 'unassigned') {
    return [{ field: 'assigneeId', op: FilterOp.Equals, value: '' }];
  }
  if (filter === 'mine') {
    return [{ field: 'assigneeId', op: FilterOp.Equals, value: userId }];
  }
  if (filter === 'open') {
    return [{ field: 'status', op: FilterOp.Equals, value: SupportStatus.Open }];
  }
  return [];
}

interface TicketQuickFilterProps {
  value: QuickFilter;
  onChange: (next: QuickFilter) => void;
}

/** One-click views of the queue, above the grid. */
export function TicketQuickFilter({ value, onChange }: Readonly<TicketQuickFilterProps>) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(_event, next: QuickFilter | null) => {
        if (next) {
          onChange(next);
        }
      }}
      aria-label="Quick filter"
      sx={{ mb: 1.5 }}
    >
      {OPTIONS.map((option) => (
        <ToggleButton key={option.value} value={option.value}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
