import { useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Stack } from '@exyconn/shell/components/ui';
import { usePageTitle } from '@exyconn/shell/components/layout/usePageTitle';
import { PageHeaderSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useClientDetailQuery, useClientSummaryQuery } from '@exyconn/shell/graphql/generated';
import { Tabber } from '@exyconn/tabber';
import { ClientDetailHeader } from './ClientDetailHeader';
import { clientTabs } from './client-detail.tabs';
import { CLIENTS_PATH } from './client-detail.paths';

/**
 * Admin › Clients › one client, at /clients/:id/:tab — everything the client hub shows them,
 * and what only staff see: contacts, invoices, payments, the communication log, links, shared
 * Legal records, support tickets and projects. "Email client" sits in the header.
 */
export function ClientDetailPage() {
  const t = useT();
  const { id = '' } = useParams();
  const {
    data,
    error: loadError,
    refetch,
  } = useClientDetailQuery({
    variables: { id },
    fetchPolicy: 'cache-and-network',
  });
  const { data: summary, refetch: refetchSummary } = useClientSummaryQuery({
    variables: { clientId: id },
    fetchPolicy: 'cache-and-network',
  });
  const client = data?.getClient;
  usePageTitle(client?.company || client?.name || t('Client'));

  const reload = () => {
    refetch().catch((error: unknown) =>
      portalLogger.warn('admin: reloading the client failed', error),
    );
  };
  const recount = () => {
    refetchSummary().catch((error: unknown) =>
      portalLogger.warn('admin: recounting the client failed', error),
    );
  };

  if (loadError && !client) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={reload}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(loadError, t('Could not load the client.'))}
      </Alert>
    );
  }
  if (!client) {
    return <PageHeaderSkeleton label="Loading the client" />;
  }
  return (
    <Stack spacing={2}>
      <ClientDetailHeader client={client} onEmailed={recount} />
      <Tabber
        basePath={`${CLIENTS_PATH}/${client.id}`}
        items={clientTabs(client, summary?.clientSummary ?? null, recount)}
        ariaLabel="Client"
      />
    </Stack>
  );
}
