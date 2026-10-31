import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Skeleton, Stack, Text } from '@exyconn/shell/components/ui';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { DomainHealthCard } from './DomainHealthCard';
import type { useMailHealth } from './useMailHealth';

type MailHealth = ReturnType<typeof useMailHealth>;

const logFailure = (error: unknown) =>
  portalLogger.warn('crm: mailbox health action failed', error);

/** What the section shows under its heading: loading, the failure, nothing yet, or the domains. */
function HealthBody({ health }: Readonly<{ health: MailHealth }>) {
  const t = useT();
  if (health.loading) {
    return <Skeleton variant="rounded" height={160} />;
  }
  if (health.error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => health.refetch().catch(logFailure)}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(health.error, t('Could not load the mailbox health.'))}
      </Alert>
    );
  }
  if (health.domains.length === 0) {
    return (
      <Text color="text.secondary">{t('Connect a mailbox to check its domain’s health.')}</Text>
    );
  }
  return (
    <Stack spacing={2}>
      {health.domains.map((domain) => (
        <DomainHealthCard
          key={domain.domain}
          domain={domain}
          checking={health.checking === domain.domain}
          onCheck={(name) => {
            health.check(name).catch(logFailure);
          }}
        />
      ))}
    </Stack>
  );
}

/**
 * Account health: SPF, DKIM, DMARC, MX and blocklists for every domain the CRM mailboxes send
 * from, re-checked every day; admins are told when a score drops.
 */
export function MailHealthSection({ health }: Readonly<{ health: MailHealth }>) {
  const t = useT();
  return (
    <Box component="section" aria-labelledby="mail-health-title">
      <Text id="mail-health-title" component="h2" size="lg" weight="semibold">
        {t('Account health')}
      </Text>
      <Text size="sm" color="text.secondary" sx={{ mb: 2 }}>
        {t('Whether receivers can trust mail from each domain. Checked every day.')}
      </Text>
      <HealthBody health={health} />
    </Box>
  );
}
