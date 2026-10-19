import { useT } from '@exyconn/i18n';
import { Button, Tooltip, useTheme } from '@exyconn/shell/components/ui';
import { CHANNELS } from './channels';
import type { CommsChannel } from './commsStore';

interface ReachOutButtonProps {
  channel: CommsChannel;
  /** Why the channel cannot be used yet; absent when it can. */
  blockedReason?: string;
  onClick: () => void;
}

/**
 * One Reach out button. A blocked one stays focusable (aria-disabled, not disabled) so the
 * tooltip saying why can be reached from the keyboard and is read out as its description.
 */
export function ReachOutButton({ channel, blockedReason, onClick }: Readonly<ReachOutButtonProps>) {
  const t = useT();
  const theme = useTheme();
  const { label, icon } = CHANNELS[channel];
  const blocked = Boolean(blockedReason);
  const button = (
    <Button
      size="small"
      variant="outlined"
      startIcon={icon}
      aria-disabled={blocked || undefined}
      onClick={blocked ? undefined : onClick}
      sx={[
        { whiteSpace: 'nowrap' },
        blocked && { opacity: theme.palette.action.disabledOpacity, cursor: 'not-allowed' },
      ]}
    >
      {t(label)}
    </Button>
  );
  if (!blockedReason) {
    return button;
  }
  return (
    <Tooltip title={t(blockedReason)} describeChild>
      {button}
    </Tooltip>
  );
}
