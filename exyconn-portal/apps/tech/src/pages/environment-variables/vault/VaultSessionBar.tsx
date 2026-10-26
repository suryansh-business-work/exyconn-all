import { useEffect, useState } from 'react';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';

const MINUTE_MS = 60_000;

interface VaultSessionBarProps {
  expiresAt: string;
  onLock: () => void;
  locking: boolean;
}

/** Minutes left, rounded up, so the bar never reads 0 while it is still open. */
const minutesLeft = (expiresAt: string) =>
  Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / MINUTE_MS));

/** "Unlocked until 14:32 · 12 min left", and the button that locks it again now. */
export function VaultSessionBar({ expiresAt, onLock, locking }: Readonly<VaultSessionBarProps>) {
  const t = useT();
  const { formatTime } = useSettings();
  const [left, setLeft] = useState(() => minutesLeft(expiresAt));

  useEffect(() => {
    setLeft(minutesLeft(expiresAt));
    const timer = globalThis.setInterval(() => setLeft(minutesLeft(expiresAt)), MINUTE_MS / 4);
    return () => globalThis.clearInterval(timer);
  }, [expiresAt]);

  return (
    <Box role="status" sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
      <Flex direction="row" justifyContent="space-between" alignItems="center" wrap spacing={1}>
        <Flex direction="row" alignItems="center" spacing={1}>
          <LockOpenIcon fontSize="small" color="warning" />
          <Text size="sm">
            {t('Unlocked until {time} · {minutes} min left. It locks itself then.', {
              time: formatTime(expiresAt),
              minutes: left,
            })}
          </Text>
        </Flex>
        <Button size="small" onClick={onLock} disabled={locking}>
          {t('Lock now')}
        </Button>
      </Flex>
    </Box>
  );
}
