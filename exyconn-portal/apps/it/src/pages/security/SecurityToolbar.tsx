import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Button, Stack, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { statCount } from '@exyconn/shell/components/data/tableStats';
import { AssetEdrStatus, useListAssetsStatsQuery } from '@exyconn/shell/graphql/generated';

/** Where the rest of security lives: incidents are one register, policies another. */
const SECURITY_LINKS = [
  { label: 'Security incidents', to: '/it/incidents' },
  { label: 'Security policies', to: '/it/policies' },
  { label: 'Device register', to: '/it/assets' },
];

/**
 * Antivirus / EDR coverage across the asset register, and the ways out to the other security
 * registers. Coverage is read from each device's recorded EDR status.
 */
export function SecurityToolbar() {
  const t = useT();
  const { data } = useListAssetsStatsQuery();
  const stats = data?.listAssetsStats;
  return (
    <Stack spacing={1.5} sx={{ mb: 1.5 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Text size="sm" weight="medium">
          {t('Endpoint protection')}
        </Text>
        {Object.values(AssetEdrStatus).map((status) => (
          <Stack key={status} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <StatusChip value={status} />
            <Text size="sm">{statCount(stats, 'edrStatus', status)}</Text>
          </Stack>
        ))}
      </Stack>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        {SECURITY_LINKS.map((link) => (
          <Button key={link.to} component={RouterLink} to={link.to} size="small" variant="outlined">
            {t(link.label)}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
