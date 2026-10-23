import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Flex, Stack } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { ConnectMailboxButton } from './ConnectMailboxButton';
import { MailboxErrorDialog } from '@exyconn/shell/components/mailboxes';
import { MailboxTable } from './MailboxTable';
import {
  MAIL_PROVIDERS,
  type MailboxActionsByProvider,
  type MailboxRow,
  type MailProviderText,
} from './mailboxes';
import { useGmailAccountActions } from './useGmailAccountActions';
import { useMailboxes, type MailboxSource } from './useMailboxes';
import { useMicrosoftMailActions } from './useMicrosoftMailActions';

const logFailure = (error: unknown) => portalLogger.warn('crm: mailbox list action failed', error);

interface LoadFailureProps {
  text: MailProviderText;
  source: MailboxSource;
}

/** One provider's list failed to load: what went wrong, and a way to try again. */
function LoadFailure({ text, source }: Readonly<LoadFailureProps>) {
  const t = useT();
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={() => source.refetch().catch(logFailure)}>
          {t('Retry')}
        </Button>
      }
    >
      {errorMessage(source.error, t(text.loadError))}
    </Alert>
  );
}

/**
 * CRM > Integrations > Email: the company's own Gmail and Microsoft mailboxes CRM emails go out
 * from, in one table, with a Connect button per provider in the header.
 */
export function EmailIntegrationsPanel() {
  const actions: MailboxActionsByProvider = {
    GMAIL: useGmailAccountActions(),
    MICROSOFT: useMicrosoftMailActions(),
  };
  const { rows, loading, sources, refetch } = useMailboxes();
  const [detailsId, setDetailsId] = useState<string | null>(null);
  // Looked up on every render so the dialog follows the row after a test or a refetch.
  const details = rows.find((row) => row.id === detailsId) ?? null;
  const failed = MAIL_PROVIDERS.filter((text) => sources[text.provider].error);
  const showTable = rows.length > 0 || failed.length === 0;
  return (
    <Box>
      <PageHeader title="Email" subtitle="The mailboxes the CRM emails contacts and companies from">
        <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {MAIL_PROVIDERS.map((text) => (
            <ConnectMailboxButton
              key={text.provider}
              label={text.connectLabel}
              available={sources[text.provider].available}
              unavailableHint={text.unavailable}
              connecting={actions[text.provider].connecting}
              onConnect={() => {
                actions[text.provider].connect().catch(logFailure);
              }}
              provider={text.provider}
            />
          ))}
        </Flex>
      </PageHeader>
      <Stack spacing={2}>
        {failed.map((text) => (
          <LoadFailure key={text.provider} text={text} source={sources[text.provider]} />
        ))}
        {showTable && (
          <MailboxTable
            rows={rows}
            loading={loading}
            actions={actions}
            onRefresh={refetch}
            onViewDetails={(row: MailboxRow) => setDetailsId(row.id)}
          />
        )}
      </Stack>
      <MailboxErrorDialog row={details} onClose={() => setDetailsId(null)} />
    </Box>
  );
}
