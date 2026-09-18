import BlockIcon from '@mui/icons-material/Block';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import { useT } from '@exyconn/i18n';
import { Button, Chip, Stack, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { ItOffboardingQuery } from '@exyconn/shell/graphql/generated';

export type LeaverRow = ItOffboardingQuery['itOffboarding'][number];

interface LeaverCardProps {
  leaver: LeaverRow;
  busy: boolean;
  onRevokeAll: () => void;
  onDisable: () => void;
}

/**
 * One leaver as IT sees them: the devices that have to come back, the access that has to go,
 * whether their knowledge has been handed over, and whether they can still sign in.
 */
export function LeaverCard({ leaver, busy, onRevokeAll, onDisable }: Readonly<LeaverCardProps>) {
  const t = useT();
  const { formatDate } = useSettings();
  const lastDay = leaver.lastWorkingDate ? formatDate(leaver.lastWorkingDate) : '—';
  const toRevoke = leaver.access.length - leaver.revokesPending;
  return (
    <Stack spacing={1.5} sx={panel}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Text size="label">{leaver.employeeName}</Text>
        <StatusChip value={leaver.stage} />
        <Text size="caption" color="text.secondary">
          {t('Last day {date}', { date: lastDay })}
        </Text>
      </Stack>
      <Text size="sm">
        {t('Devices to recover: {list}', {
          list: leaver.assets.map((asset) => `${asset.assetTag} ${asset.name}`).join(', ') || '—',
        })}
      </Text>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        {leaver.access.map((grant) => (
          <Chip key={grant.application} size="small" color="warning" label={grant.application} />
        ))}
        <Chip
          size="small"
          variant="outlined"
          color={leaver.knowledgeTransferDone ? 'success' : 'default'}
          label={leaver.knowledgeTransferDone ? t('Handover done') : t('Handover pending')}
        />
      </Stack>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          color="warning"
          startIcon={<BlockIcon />}
          disabled={busy || toRevoke <= 0}
          onClick={onRevokeAll}
        >
          {t('Revoke all access')}
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<PersonOffIcon />}
          disabled={busy || !leaver.accountActive}
          onClick={onDisable}
        >
          {leaver.accountActive ? t('Disable account') : t('Account disabled')}
        </Button>
      </Stack>
    </Stack>
  );
}
