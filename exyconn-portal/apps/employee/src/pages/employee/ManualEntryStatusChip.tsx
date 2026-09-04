import { Chip, Tooltip } from '@exyconn/shell/components/ui';

/** MUI colour for each state a claim can be in. */
const TONE = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
} as const;

const LABEL = {
  PENDING: 'Awaiting review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
} as const;

type ManualEntryStatus = keyof typeof TONE;

interface ManualEntryStatusChipProps {
  status: ManualEntryStatus;
  /** The reviewer's reason. Shown on hover, which is where a rejection is explained. */
  note?: string | null;
}

/** Where one off-computer claim stands, with the reviewer's reason behind it. */
export function ManualEntryStatusChip({ status, note }: Readonly<ManualEntryStatusChipProps>) {
  const chip = <Chip size="small" color={TONE[status]} label={LABEL[status]} />;
  if (!note) {
    return chip;
  }
  return (
    <Tooltip title={note}>
      <span>{chip}</span>
    </Tooltip>
  );
}
