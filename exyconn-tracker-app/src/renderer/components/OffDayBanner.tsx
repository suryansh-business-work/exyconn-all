import type { ReactElement } from 'react';
import { Alert, TRACKER_RADIUS } from '@exyconn/ui';
import EventBusyOutlined from '@mui/icons-material/EventBusyOutlined';

interface Props {
  /** `offDayMessage(workday, t)` — already translated. */
  message: string;
}

/**
 * Today is off — the employee's week off, a holiday or approved leave — so there is nothing to
 * mark and nothing to start. Shown in place of the attendance gate and the tracking controls,
 * in the same sentence the controller refuses with.
 */
export default function OffDayBanner({ message }: Readonly<Props>): ReactElement {
  return (
    <Alert
      severity="info"
      variant="outlined"
      icon={<EventBusyOutlined />}
      sx={{ borderRadius: `${TRACKER_RADIUS}px` }}
    >
      {message}
    </Alert>
  );
}
