import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  MailDomainHealthDocument,
  useCheckMailDomainHealthMutation,
  useMailDomainHealthQuery,
} from '@exyconn/shell/graphql/generated';

/** The health of every sending domain, and Check now on one of them. */
export function useMailHealth() {
  const t = useT();
  const notify = useNotify();
  const query = useMailDomainHealthQuery({ fetchPolicy: 'cache-and-network' });
  // A domain's health has no id for the cache to merge on, so the list is read again.
  const [checkDomain] = useCheckMailDomainHealthMutation({
    refetchQueries: [MailDomainHealthDocument],
    awaitRefetchQueries: true,
  });
  const [checking, setChecking] = useState<string | null>(null);

  const check = async (domain: string) => {
    setChecking(domain);
    try {
      const { data } = await checkDomain({ variables: { domain } });
      const score = data?.checkMailDomainHealth.score ?? 0;
      notify(t('{domain} checked: Setup Score {score}', { domain, score }), 'success');
    } catch (error) {
      portalLogger.warn('crm: mailbox health check failed', error);
      notify(errorMessage(error, t('Could not check {domain}', { domain })), 'error');
    } finally {
      setChecking(null);
    }
  };

  return {
    domains: query.data?.mailDomainHealth ?? [],
    loading: query.loading && !query.data,
    error: query.data ? undefined : query.error,
    refetch: query.refetch,
    check,
    checking,
  };
}
