import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { appUrl } from '@exyconn/shell/config/apps';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';

/**
 * API keys and webhooks moved to the developer portal (developers.exyconn.com). An old link or
 * bookmark to Admin › Integrations lands on the same tab there.
 */
export function IntegrationsPage() {
  const { tab } = useParams();
  useEffect(() => {
    const target = tab === 'webhooks' ? '/developers/webhooks' : '/developers/api-keys';
    globalThis.location.replace(appUrl('developers', target));
  }, [tab]);
  return <LoadingState />;
}
