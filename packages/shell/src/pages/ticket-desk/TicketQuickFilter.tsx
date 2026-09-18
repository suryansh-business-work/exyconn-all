import { useT } from '@exyconn/i18n';
import { ToggleButton, ToggleButtonGroup } from '@/components/ui';
import {
  FilterOp,
  SlaState,
  SupportRequester,
  SupportStatus,
  TicketChannel,
  type TableFilterInput,
} from '@/graphql/generated';

export type QuickFilter =
  'all' | 'unassigned' | 'mine' | 'open' | 'overdue' | 'customers' | 'employees' | 'emailed';

const OPTIONS: Array<{ value: QuickFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'mine', label: 'Mine' },
  { value: 'open', label: 'Open' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'customers', label: 'Customers' },
  { value: 'employees', label: 'Employees' },
  { value: 'emailed', label: 'Emailed in' },
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
  emailed: () => equals('channel', TicketChannel.Email),
};

export function quickFilters(filter: QuickFilter, userId: string): TableFilterInput[] {
  return FILTERS[filter](userId);
}

/** The views a desk that only works employee tickets needs — IT's helpdesk. */
export const EMPLOYEE_DESK_FILTERS: readonly QuickFilter[] = [
  'all',
  'unassigned',
  'mine',
  'open',
  'overdue',
];

interface TicketQuickFilterProps {
  value: QuickFilter;
  onChange: (next: QuickFilter) => void;
  /** Which views to offer; every one of them when omitted (the Support console). */
  only?: readonly QuickFilter[];
}

/** One-click views of the queue, above the grid. */
export function TicketQuickFilter({ value, onChange, only }: Readonly<TicketQuickFilterProps>) {
  const t = useT();
  const offered = only ? OPTIONS.filter((option) => only.includes(option.value)) : OPTIONS;
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
      aria-label={t('Quick filter')}
      sx={{ mb: 1.5, flexWrap: 'wrap' }}
    >
      {offered.map((option) => (
        <ToggleButton key={option.value} value={option.value}>
          {t(option.label)}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
