import { useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { Alert, Button, Flex, Heading, Link, Text } from '@exyconn/shell/components/ui';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useUnsubscribeFromMarketingMutation } from '@exyconn/shell/graphql/generated';
import { EMAIL_PREFERENCES_PATH } from '@exyconn/shell/app/PortalApp';
import { useT } from '@exyconn/i18n';
import { LoginShell } from '../Login/LoginShell';

export const UNSUBSCRIBE_CONFIRMATION =
  'You have been unsubscribed. You will not receive marketing emails from us again.';

const MISSING_TOKEN =
  'This link is missing its unsubscribe code. Open the link from the email again.';

/** The token preview and test emails carry. It never unsubscribes anyone. */
const PREVIEW_TOKEN = 'preview';

type Outcome =
  | { state: 'idle' }
  | { state: 'pending' }
  | { state: 'done' }
  | { state: 'failed'; message: string };

/** The answer once the button has been pressed. */
function Result({ outcome }: Readonly<{ outcome: Outcome }>) {
  const t = useT();
  if (outcome.state === 'failed') {
    return <Alert severity="error">{t(outcome.message)}</Alert>;
  }
  if (outcome.state === 'done') {
    return (
      <Alert severity="success" role="status">
        {t(UNSUBSCRIBE_CONFIRMATION)}
      </Alert>
    );
  }
  return null;
}

/**
 * The screen a campaign email's unsubscribe link opens: `/unsubscribe?t=…`.
 *
 * It asks for one click rather than acting on arrival. Mail scanners and link previewers
 * open every link in a message; acting on a visit would unsubscribe people who never asked.
 * Mail clients that offer their own Unsubscribe button use the one-click POST endpoint
 * instead, so nobody has to see this page to leave.
 */
export function UnsubscribePage() {
  const t = useT();
  const [params] = useSearchParams();
  const token = params.get('t') ?? '';
  const [unsubscribe] = useUnsubscribeFromMarketingMutation();
  const [outcome, setOutcome] = useState<Outcome>({ state: 'idle' });
  const isPreview = token === PREVIEW_TOKEN;

  const confirm = () => {
    setOutcome({ state: 'pending' });
    unsubscribe({ variables: { token } })
      .then(() => setOutcome({ state: 'done' }))
      .catch((error: unknown) =>
        setOutcome({ state: 'failed', message: errorMessage(error, 'Could not unsubscribe you') }),
      );
  };

  return (
    <LoginShell>
      {() => (
        <Flex direction="column" spacing={2}>
          <Heading level={4}>{t('Unsubscribe')}</Heading>
          {!token && <Alert severity="warning">{t(MISSING_TOKEN)}</Alert>}
          {isPreview && (
            <Alert severity="info">
              {t('This is a preview or test email link. Nothing will change.')}
            </Alert>
          )}
          {token && outcome.state !== 'done' && (
            <>
              <Text size="sm">
                {t(
                  'Stop all marketing emails to this address? Account and security emails will still arrive.',
                )}
              </Text>
              <Button
                variant="contained"
                onClick={confirm}
                disabled={isPreview || outcome.state === 'pending'}
              >
                {t(
                  outcome.state === 'pending' ? 'Unsubscribing…' : 'Unsubscribe from all marketing',
                )}
              </Button>
              <Link
                component={RouterLink}
                to={`${EMAIL_PREFERENCES_PATH}?t=${encodeURIComponent(token)}`}
              >
                {t('Choose which emails you get instead')}
              </Link>
            </>
          )}
          <Result outcome={outcome} />
        </Flex>
      )}
    </LoginShell>
  );
}
