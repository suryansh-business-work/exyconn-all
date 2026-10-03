import { useT } from '@exyconn/i18n';
import { Chip, Text } from '@exyconn/shell/components/ui';
import type { SslCertificateStatus } from '@exyconn/shell/graphql/generated';
import { SSL_STATUS_COLOR, SSL_STATUS_LABEL } from './ssl.types';

/** A certificate's verdict as a coloured chip. */
export function SslStatusChip({ status }: Readonly<{ status: SslCertificateStatus }>) {
  const t = useT();
  return (
    <Chip
      size="small"
      variant="filled"
      color={SSL_STATUS_COLOR[status]}
      label={t(SSL_STATUS_LABEL[status])}
    />
  );
}

interface DaysLeftProps {
  daysLeft?: number | null;
  warningDays: number;
}

/** Days until expiry: bold inside the warning window, red once it has passed, a dash if unknown. */
export function DaysLeft({ daysLeft, warningDays }: Readonly<DaysLeftProps>) {
  const t = useT();
  if (daysLeft === null || daysLeft === undefined) {
    return <Text size="sm">—</Text>;
  }
  if (daysLeft < 0) {
    return (
      <Text size="sm" weight="bold" sx={{ color: 'error.main' }}>
        {t('Expired {days} days ago', { days: Math.abs(daysLeft) })}
      </Text>
    );
  }
  return (
    <Text size="sm" weight={daysLeft <= warningDays ? 'bold' : 'regular'}>
      {t('{days} days', { days: daysLeft })}
    </Text>
  );
}
