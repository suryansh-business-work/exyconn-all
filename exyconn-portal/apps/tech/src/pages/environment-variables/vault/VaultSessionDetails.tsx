import { useT } from '@exyconn/i18n';
import { Flex, Link, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useTechVaultSessionActivityQuery,
  type TechVaultSessionActivityQuery,
} from '@exyconn/shell/graphql/generated';
import { locationText, type VaultSessionRow } from './vault-history-grid';

type ActivityRow = TechVaultSessionActivityQuery['techVaultSessionActivity'][number];

/** One labelled fact about the session. */
function Fact({ label, value }: Readonly<{ label: string; value: string }>) {
  const t = useT();
  return (
    <Flex direction="column">
      <Text size="sm" color="text.secondary">
        {t(label)}
      </Text>
      <Text sx={{ wordBreak: 'break-word' }}>{value || '—'}</Text>
    </Flex>
  );
}

/** Everything known about one unlock, and everything changed or revealed while it was open. */
export function VaultSessionDetails({ session }: Readonly<{ session: VaultSessionRow }>) {
  const t = useT();
  const { formatDateTime } = useSettings();
  const activity = useTechVaultSessionActivityQuery({ variables: { id: session.id } });
  const { latitude, longitude } = session.location;
  const mapUrl =
    latitude != null && longitude != null
      ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`
      : '';
  const accuracy = session.location.accuracy;
  const ended = session.endedAt ? formatDateTime(session.endedAt) : t('Still open');

  const columns: Column<ActivityRow>[] = [
    { key: 'createdAt', label: 'When', render: (r) => formatDateTime(r.createdAt) },
    { key: 'action', label: 'Action' },
    { key: 'summary', label: 'What' },
  ];

  return (
    <Flex direction="column" spacing={2}>
      <Fact label="Who" value={`${session.userName} <${session.email}>`} />
      <Fact label="Why" value={session.reason} />
      <Fact label="Unlocked" value={formatDateTime(session.unlockedAt)} />
      <Fact label="Ended" value={ended} />
      <Fact label="IP address" value={session.ip} />
      <Fact label="Browser" value={session.userAgent} />
      <Fact label="Location" value={t(locationText(session))} />
      {accuracy != null && (
        <Fact label="Accuracy" value={t('Within {metres} m', { metres: Math.round(accuracy) })} />
      )}
      {mapUrl && (
        <Link href={mapUrl} target="_blank" rel="noopener noreferrer">
          {t('Open the location on a map')}
        </Link>
      )}
      <Text weight="medium">{t('Done during this session')}</Text>
      {activity.error && <Text color="error">{activity.error.message}</Text>}
      <DataTable
        columns={columns}
        rows={[...(activity.data?.techVaultSessionActivity ?? [])]}
        loading={activity.loading}
        emptyMessage="Nothing was changed or revealed."
        onRefresh={activity.refetch}
      />
    </Flex>
  );
}
