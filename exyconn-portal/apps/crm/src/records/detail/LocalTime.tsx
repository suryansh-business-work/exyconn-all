import { useEffect, useState } from 'react';
import { formatTime, useI18n, useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';

const MINUTE = 60_000;

/** The time where the person is now — in their zone, in the portal's time format — each minute. */
export function LocalTime({ timezone }: Readonly<{ timezone: string }>) {
  const t = useT();
  const { settings } = useI18n();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = globalThis.setInterval(() => setNow(new Date()), MINUTE);
    return () => globalThis.clearInterval(timer);
  }, []);
  if (!timezone) {
    return null;
  }
  return (
    <Text>
      {formatTime(now, { ...settings, timezone })}{' '}
      <Text component="span" size="caption" color="text.secondary">
        ({t(timezone)})
      </Text>
    </Text>
  );
}
