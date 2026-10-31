import RefreshIcon from '@mui/icons-material/Refresh';
import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Button, Divider, Flex, Stack, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { HealthCheckItem } from './HealthCheckItem';
import { HealthScoreChip } from './HealthScoreChip';
import type { DomainHealth } from './mailHealth';

interface DomainHealthCardProps {
  domain: DomainHealth;
  checking: boolean;
  onCheck: (domain: string) => void;
}

/** When the domain was last checked, and the score before it when that changed. */
function CheckedLine({ domain }: Readonly<{ domain: DomainHealth }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  if (!domain.checkedAt) {
    return <>{t('Never checked. Check it now to see its Setup Score.')}</>;
  }
  const when = formatDateTime(domain.checkedAt);
  const previous = domain.previousScore;
  if (previous != null && previous !== domain.score) {
    return <>{t('Checked {when} · was {previous}', { when, previous })}</>;
  }
  return <>{t('Checked {when}', { when })}</>;
}

/** One sending domain: its Setup Score, Check now, and every check with its fix. */
export function DomainHealthCard({ domain, checking, onCheck }: Readonly<DomainHealthCardProps>) {
  const t = useT();
  const titleId = `mail-health-${domain.domain}`;
  return (
    <Box component="section" aria-labelledby={titleId} sx={panel}>
      <Flex
        direction="row"
        spacing={2}
        alignItems="flex-start"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
      >
        <Box sx={{ minWidth: 0 }}>
          <Flex direction="row" spacing={1} alignItems="center">
            <Text
              id={titleId}
              component="h3"
              size="lg"
              weight="semibold"
              sx={{ overflowWrap: 'anywhere' }}
            >
              {domain.domain}
            </Text>
            <HealthScoreChip score={domain.score} />
          </Flex>
          <Text size="sm" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
            {domain.mailboxes.join(', ')}
          </Text>
          <Text size="sm" color="text.secondary">
            <CheckedLine domain={domain} />
          </Text>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          disabled={checking}
          onClick={() => onCheck(domain.domain)}
          aria-label={t('Check {domain} now', { domain: domain.domain })}
        >
          {checking ? t('Checking…') : t('Check now')}
        </Button>
      </Flex>
      {domain.checks.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={2}>
            {domain.checks.map((check) => (
              <HealthCheckItem key={check.code} check={check} />
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
}
