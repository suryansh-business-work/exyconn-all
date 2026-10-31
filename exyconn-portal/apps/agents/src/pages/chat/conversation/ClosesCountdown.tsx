import { useT } from '@exyconn/i18n';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Chip } from '@exyconn/shell/components/ui';
import { useNow } from '../useNow';

/** The last stretch before an idle chat closes, shown in the warning colour. */
const WARNING_MS = 2 * 60_000;

/** Milliseconds as m:ss, e.g. 9:41. */
function minutesSeconds(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const seconds = String(total % 60).padStart(2, '0');
  return `${Math.floor(total / 60)}:${seconds}`;
}

/** "Closes in 9:41 without a message", ticking every second, for an open chat. */
export function ClosesCountdown({ expiresAt }: Readonly<{ expiresAt: string }>) {
  const t = useT();
  const now = useNow(1000);
  const left = new Date(expiresAt).getTime() - now;
  return (
    <Chip
      size="small"
      variant="outlined"
      icon={<TimerOutlinedIcon />}
      color={left <= WARNING_MS ? 'warning' : 'default'}
      label={t('Closes in {time} without a message', { time: minutesSeconds(left) })}
    />
  );
}
