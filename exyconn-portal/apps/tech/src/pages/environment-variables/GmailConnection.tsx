import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Flex } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  GmailConfigDocument,
  useDisconnectGmailMutation,
  useStartGmailConnectMutation,
  useTestGmailConfigMutation,
  type GmailConfigFieldsFragment,
} from '@exyconn/shell/graphql/generated';

/** The address to come back to after Google, without the outcome of an earlier try. */
function returnAddress(): string {
  const url = new URL(window.location.href);
  url.searchParams.delete('gmailConnected');
  url.searchParams.delete('gmailError');
  return url.toString();
}

/**
 * Which mailbox is connected, and the Connect / Test / Disconnect buttons. Google sends the
 * browser back here with the outcome, which is announced once and taken off the address.
 */
export function GmailConnection({ config }: Readonly<{ config: GmailConfigFieldsFragment }>) {
  const t = useT();
  const notify = useNotify();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const [start, { loading: starting }] = useStartGmailConnectMutation();
  const [test, { loading: testing }] = useTestGmailConfigMutation({
    refetchQueries: [GmailConfigDocument],
  });
  const [disconnect] = useDisconnectGmailMutation({ refetchQueries: [GmailConfigDocument] });

  useEffect(() => {
    const connected = params.get('gmailConnected');
    const failed = params.get('gmailError');
    if (connected === null && failed === null) {
      return;
    }
    if (failed === null) {
      notify('Gmail connected as {email}', 'success', { email: connected ?? '' });
    } else {
      notify(failed, 'error');
    }
    const rest = new URLSearchParams(params);
    rest.delete('gmailConnected');
    rest.delete('gmailError');
    setParams(rest, { replace: true });
  }, [params, setParams, notify]);

  const run = async (action: () => Promise<unknown>, failure: string) => {
    try {
      await action();
    } catch (error) {
      portalLogger.warn('tech: a Gmail action failed', error);
      notify(errorMessage(error, failure), 'error');
    }
  };
  const onConnect = () =>
    run(async () => {
      const { data } = await start({ variables: { returnTo: returnAddress() } });
      if (data?.startGmailConnect) {
        window.location.assign(data.startGmailConnect);
      }
    }, 'Could not start the Gmail connection');
  const onTest = () =>
    run(async () => {
      const { data } = await test();
      notify(data?.testGmailConfig ?? 'Gmail answered', 'success');
    }, 'The Gmail test failed');
  const onDisconnect = async () => {
    const ok = await confirm({
      title: 'Disconnect Gmail',
      message: 'The CRM stops sending and reading email until Gmail is connected again.',
      confirmText: 'Disconnect',
      destructive: true,
    });
    if (ok) {
      await run(() => disconnect(), 'Could not disconnect Gmail');
    }
  };

  const ready = Boolean(config.clientId && config.hasClientSecret);
  return (
    <Flex direction="column" spacing={1.5} sx={{ mb: 2 }}>
      {config.connected ? (
        <Alert severity={config.lastError ? 'warning' : 'success'}>
          {t('Connected as {email}.', { email: config.connectedEmail })} {config.lastError}
        </Alert>
      ) : (
        <Alert severity="info">
          {t('No mailbox connected yet. Save the client, then connect.')}
        </Alert>
      )}
      <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button variant="contained" onClick={onConnect} loading={starting} disabled={!ready}>
          {config.connected ? t('Reconnect') : t('Connect Gmail')}
        </Button>
        <Button variant="outlined" onClick={onTest} loading={testing} disabled={!config.connected}>
          {t('Test')}
        </Button>
        {config.connected && (
          <Button color="error" variant="outlined" onClick={onDisconnect}>
            {t('Disconnect')}
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
