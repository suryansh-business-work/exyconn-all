import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Heading, Text } from '@exyconn/shell/components/ui';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useUnsubscribeFromMarketingMutation } from '@exyconn/shell/graphql/generated';
import { LoginShell } from '../Login/LoginShell';

export const UNSUBSCRIBE_CONFIRMATION =
  'You have been unsubscribed. You will not receive marketing emails from us again.';

const MISSING_TOKEN =
  'This link is missing its unsubscribe code. Open the link from the email again.';

type Outcome = { state: 'pending' } | { state: 'done' } | { state: 'failed'; message: string };

/** The one line the page ends on, whichever way the request went. */
function Result({ outcome }: Readonly<{ outcome: Outcome }>) {
  if (outcome.state === 'pending') {
    return <Text size="sm">Updating your preferences…</Text>;
  }
  if (outcome.state === 'failed') {
    return <Alert severity="error">{outcome.message}</Alert>;
  }
  return <Alert severity="success">{UNSUBSCRIBE_CONFIRMATION}</Alert>;
}

/**
 * The screen a campaign email's unsubscribe link opens: `/unsubscribe?t=…`.
 *
 * It acts on arrival rather than asking for a confirming click. Somebody who followed an
 * unsubscribe link has already said what they want, and a second step is the pattern that
 * makes opting out feel like something the sender is resisting.
 */
export function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get('t') ?? '';
  const [unsubscribe] = useUnsubscribeFromMarketingMutation();
  const [outcome, setOutcome] = useState<Outcome>({ state: 'pending' });
  // React mounts effects twice in development; the mutation is idempotent, but firing it
  // twice would still race two answers onto the screen.
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) {
      return;
    }
    sent.current = true;
    unsubscribe({ variables: { token } })
      .then(() => setOutcome({ state: 'done' }))
      .catch((error: unknown) =>
        setOutcome({ state: 'failed', message: errorMessage(error, 'Could not unsubscribe you') }),
      );
  }, [token, unsubscribe]);

  return (
    <LoginShell>
      {() => (
        <>
          <Heading level={4} sx={{ mb: 2 }}>
            Unsubscribe
          </Heading>
          {token ? <Result outcome={outcome} /> : <Alert severity="warning">{MISSING_TOKEN}</Alert>}
        </>
      )}
    </LoginShell>
  );
}
