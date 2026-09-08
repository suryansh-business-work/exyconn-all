import { ToggleButton, ToggleButtonGroup } from '@exyconn/shell/components/ui';
import {
  FilterOp,
  SlaState,
  SupportRequester,
  SupportStatus,
  type TableFilterInput,
} from '@exyconn/shell/graphql/generated';

export type QuickFilter =
  'all' | 'unassigned' | 'mine' | 'open' | 'overdue' | 'customers' | 'employees';

const OPTIONS: Array<{ value: QuickFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'mine', label: 'Mine' },
  { value: 'open', label: 'Open' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'customers', label: 'Customers' },
  { value: 'employees', label: 'Employees' },
];

const equals = (field: string, value: string): TableFilterInput[] => [
  { field, op: FilterOp.Equals, value },
];

/**
 * The server-side filters one quick-filter choice adds to every page request.
 *
 * "Overdue" travels as an SLA state rather than a column: the server turns it into
 * "unresolved and past its deadline", which is two conditions the grid cannot express.
 */
const FILTERS: Record<QuickFilter, (userId: string) => TableFilterInput[]> = {
  all: () => [],
  unassigned: () => equals('assigneeId', ''),
  mine: (userId) => equals('assigneeId', userId),
  open: () => equals('status', SupportStatus.Open),
  overdue: () => equals('slaState', SlaState.Breached),
  customers: () => equals('requesterType', SupportRequester.Client),
  employees: () => equals('requesterType', SupportRequester.Employee),
};

export function quickFilters(filter: QuickFilter, userId: string): TableFilterInput[] {
  return FILTERS[filter](userId);
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
      sx={{ mb: 1.5, flexWrap: 'wrap' }}
    >
      {OPTIONS.map((option) => (
        <ToggleButton key={option.value} value={option.value}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
