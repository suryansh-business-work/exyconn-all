import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import type { RowAction } from '@exyconn/shell/components/data/DataTable';

const PENDING = 'PENDING';

interface Decidable {
  id: string;
  status: string;
}

/** Approve / reject row actions, shown only while there is still something to decide. */
export function decisionActions<T extends Decidable>(
  onApprove: (row: T) => void,
  onReject: (row: T) => void,
): RowAction<T>[] {
  const decided = (row: T) => row.status !== PENDING;
  return [
    {
      icon: <CheckIcon fontSize="small" />,
      tooltip: 'Approve',
      ariaLabel: 'approve',
      color: 'success',
      onClick: onApprove,
      hidden: decided,
    },
    {
      icon: <CloseIcon fontSize="small" />,
      tooltip: 'Reject',
      ariaLabel: 'reject',
      color: 'error',
      onClick: onReject,
      hidden: decided,
    },
  ];
}
