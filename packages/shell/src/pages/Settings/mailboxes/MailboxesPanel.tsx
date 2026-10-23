import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Heading, Text } from '@/components/ui';
import { readingPanel } from '@/components/glass/glass';
import { LoadingState } from '@/components/feedback/CenteredState';
import { MailboxErrorDialog } from '@/components/mailboxes';
import { ConnectMailboxButtons, useConnectMailbox, useMyMailboxes } from '@/components/email';
import type { MyMailboxFieldsFragment } from '@/graphql/generated';
import { MyMailboxItem } from './MyMailboxItem';
import { useMyMailboxActions } from './useMyMailboxActions';

/** Everything below the heading: loading, a failed load, or the list and the way to add one. */
function MailboxesBody() {
  const t = useT();
  const { mailboxes, providers, loading, error, refetch } = useMyMailboxes();
  const actions = useMyMailboxActions();
  const { connect } = useConnectMailbox();
  const [errorOf, setErrorOf] = useState<MyMailboxFieldsFragment | null>(null);
  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            {t('Retry')}
          </Button>
        }
      >
        {t('Your mailboxes could not be loaded.')}
      </Alert>
    );
  }
  return (
    <>
      {mailboxes.length === 0 ? (
        <Text size="sm" color="text.secondary" sx={{ mb: 2 }}>
          {t('No mailbox connected yet.')}
        </Text>
      ) : (
        <Box
          component="ul"
          aria-label={t('Your mailboxes')}
          sx={{ m: 0, p: 0, mb: 2, listStyle: 'none' }}
        >
          {mailboxes.map((mailbox) => (
            <MyMailboxItem
              key={mailbox.id}
              mailbox={mailbox}
              actions={{
                ...actions,
                reconnect: (row) => connect(row.provider, row.email),
                showError: setErrorOf,
              }}
            />
          ))}
        </Box>
      )}
      <ConnectMailboxButtons providers={providers} />
      <MailboxErrorDialog row={errorOf} onClose={() => setErrorOf(null)} />
    </>
  );
}

/**
 * The person's own mailboxes: the Gmail or Microsoft accounts the email window sends from when
 * they click an address anywhere in the portals. Separate from a company's CRM mailboxes.
 */
export function MailboxesPanel() {
  const t = useT();
  return (
    <Box sx={readingPanel}>
      <Heading level={6} sx={{ mb: 0.5 }}>
        {t('Mailboxes')}
      </Heading>
      <Text size="sm" component="p" color="text.secondary" sx={{ mb: 2 }}>
        {t(
          'Connect your own Gmail or Microsoft mailbox. Clicking an email address in any portal opens a window that sends from it.',
        )}
      </Text>
      <MailboxesBody />
    </Box>
  );
}
