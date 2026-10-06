import { useT } from '@exyconn/i18n';
import { Chip, Text } from '@exyconn/shell/components/ui';
import type { CmsDomainDnsRow } from '../../website/forms/cms-a-record';

/** Where a domain points: at the websites' server, elsewhere, nowhere — or why it is unknown. */
export function DnsStatusChip({ row }: Readonly<{ row: CmsDomainDnsRow }>) {
  const t = useT();
  if (row.error) {
    return (
      <Text size="sm" color="error.main">
        {row.error}
      </Text>
    );
  }
  if (row.records.length === 0) {
    return <Chip size="small" label={t('No A record')} />;
  }
  if (row.pointsHere) {
    return <Chip size="small" color="success" label={t('Points to Exyconn')} />;
  }
  return <Chip size="small" color="warning" label={t('Points elsewhere')} />;
}
