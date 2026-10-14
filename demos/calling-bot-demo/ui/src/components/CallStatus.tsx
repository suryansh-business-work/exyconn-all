import { useT } from '@exyconn/i18n';
import { Flex, Text } from '@exyconn/shell/components/ui';
import type { CallPhase } from '../call/transcript';
import { CallTimer } from './CallTimer';

const LABELS: Record<CallPhase, string> = {
  idle: 'Ready to call',
  connecting: 'Connecting…',
  live: 'On the call',
  ended: 'Call ended',
};

/** Where the call is, and for how long it has been live. */
export function CallStatus({
  phase,
  startedAt,
}: Readonly<{ phase: CallPhase; startedAt: number | null }>) {
  const t = useT();
  return (
    <Flex alignItems="center" justifyContent="space-between" role="status">
      <Text sx={{ fontWeight: 600 }}>{t(LABELS[phase])}</Text>
      {phase === 'live' && startedAt !== null && <CallTimer startedAt={startedAt} />}
    </Flex>
  );
}
