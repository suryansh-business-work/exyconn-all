import { useT } from '@exyconn/i18n';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import type { MessageStatus } from '@exyconn/wa-flow';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_MOTION } from '../../../theme/wa.tokens';

const LABELS: Readonly<Record<MessageStatus, string>> = {
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
};

/** One grey tick when sent, two when delivered, two blue when read. */
export function Ticks({ status }: Readonly<{ status: MessageStatus }>) {
  const t = useT();
  const c = useWaPalette();
  const Icon = status === 'sent' ? DoneIcon : DoneAllIcon;
  return (
    <Icon
      titleAccess={t(LABELS[status])}
      sx={{
        fontSize: WA_FONT.title,
        color: status === 'read' ? c.tickRead : c.tickGrey,
        transition: `color ${WA_MOTION.normal}`,
      }}
    />
  );
}
