import { useCallback } from 'react';
import { useUnsubscribeFromStatusMutation } from '@exyconn/shell/graphql/generated';
import { SubscriptionResultPage } from './SubscriptionResultPage';

/** Where the unsubscribe link at the foot of every status email lands. */
export function UnsubscribePage() {
  const [unsubscribe] = useUnsubscribeFromStatusMutation();
  const action = useCallback(
    (token: string) => unsubscribe({ variables: { token } }),
    [unsubscribe],
  );

  return (
    <SubscriptionResultPage
      title="Status updates"
      action={action}
      successMessage="You are unsubscribed. We will not email you about incidents again."
      missingTokenMessage="This unsubscribe link is missing its token. Open the link from the email again."
    />
  );
}
