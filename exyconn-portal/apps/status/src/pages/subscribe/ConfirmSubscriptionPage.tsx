import { useCallback } from 'react';
import { useConfirmStatusSubscriptionMutation } from '@exyconn/shell/graphql/generated';
import { SubscriptionResultPage } from './SubscriptionResultPage';

/** Where the confirm link in the subscription email lands. */
export function ConfirmSubscriptionPage() {
  const [confirm] = useConfirmStatusSubscriptionMutation();
  const action = useCallback((token: string) => confirm({ variables: { token } }), [confirm]);

  return (
    <SubscriptionResultPage
      title="Status updates"
      action={action}
      successMessage="You are subscribed. We will email you when something breaks and again when it is fixed."
      missingTokenMessage="This confirmation link is missing its token. Open the link from the email again."
    />
  );
}
