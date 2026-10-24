import { useT } from '@exyconn/i18n';
import { IconButton, Tooltip, useTheme } from '@exyconn/shell/components/ui';
import { CHANNELS } from './channels';
import type { CommsChannel } from './commsStore';

interface ReachOutButtonProps {
  channel: CommsChannel;
  /** Why the channel cannot be used yet; absent when it can. */
  blockedReason?: string;
  onClick: () => void;
}

/**
 * One Reach out icon; its tooltip names the channel, or says why it cannot be used yet. A
 * blocked one stays focusable (aria-disabled, not disabled) so that reason can be reached from
 * the keyboard and is read out as its description.
 */
export function ReachOutButton({ channel, blockedReason, onClick }: Readonly<ReachOutButtonProps>) {
  const t = useT();
  const theme = useTheme();
  const { label, icon } = CHANNELS[channel];
  const blocked = Boolean(blockedReason);
  return (
    <Tooltip title={t(blockedReason ?? label)} describeChild={blocked}>
      <IconButton
        aria-label={t(label)}
        aria-disabled={blocked || undefined}
        onClick={blocked ? undefined : onClick}
        sx={[
          { border: 1, borderColor: 'divider' },
          blocked && { opacity: theme.palette.action.disabledOpacity, cursor: 'not-allowed' },
        ]}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
}
