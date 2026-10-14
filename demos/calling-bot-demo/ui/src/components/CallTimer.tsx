import { useEffect, useState } from 'react';
import { Text } from '@exyconn/shell/components/ui';

const pad = (value: number) => String(value).padStart(2, '0');

/** How long the call has been live, as mm:ss, ticking every second. */
export function CallTimer({ startedAt }: Readonly<{ startedAt: number }>) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = globalThis.setInterval(() => setNow(Date.now()), 1000);
    return () => globalThis.clearInterval(tick);
  }, []);
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  return (
    <Text color="text.secondary" aria-label="Call length">
      {`${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`}
    </Text>
  );
}
