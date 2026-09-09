import { Chip, Stack } from '@/components/ui';

export interface ApprovalGroup {
  kind: string;
  label: string;
  count: number;
}

interface Props {
  groups: ApprovalGroup[];
  total: number;
  /** Null means every kind. */
  active: string | null;
  onChange: (kind: string | null) => void;
}

/**
 * The counts, which double as the filter.
 *
 * Selecting one narrows the query server-side rather than hiding rows the browser already
 * holds — the queue is the caller's whole backlog, and paging it down here would be a
 * filter that lies about how much is left.
 */
export function ApprovalKindFilter({ groups, total, active, onChange }: Readonly<Props>) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
      <Chip
        label={`All (${total})`}
        color={active === null ? 'primary' : 'default'}
        variant={active === null ? 'filled' : 'outlined'}
        onClick={() => onChange(null)}
      />
      {groups.map((group) => (
        <Chip
          key={group.kind}
          label={`${group.label} (${group.count})`}
          color={active === group.kind ? 'primary' : 'default'}
          variant={active === group.kind ? 'filled' : 'outlined'}
          onClick={() => onChange(group.kind)}
        />
      ))}
    </Stack>
  );
}
