import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Flex, Heading, Skeleton, Text } from '@exyconn/shell/components/ui';
import { useEmailPreferencesQuery } from '@exyconn/shell/graphql/generated';
import { useT } from '@exyconn/i18n';
import { LoginShell } from '../Login/LoginShell';
import { EmailPreferencesForm, type EmailPreferences } from './forms/email-preferences';

/** What the page shows once the recipient's preferences are loaded. */
function PreferencesBody({
  token,
  preferences,
}: Readonly<{ token: string; preferences: EmailPreferences }>) {
  const t = useT();
  const [current, setCurrent] = useState(preferences);
  const [notice, setNotice] = useState<{ severity: 'success' | 'error'; message: string } | null>(
    null,
  );
  if (current.preview) {
    return (
      <Alert severity="info">
        {t('This is a preview or test email link. Nothing can be changed here.')}
      </Alert>
    );
  }
  return (
    <Flex direction="column" spacing={2}>
      <Text size="sm">{t('Email preferences for {email}', { email: current.email })}</Text>
      {notice && (
        <Alert severity={notice.severity} role={notice.severity === 'error' ? 'alert' : 'status'}>
          {t(notice.message)}
        </Alert>
      )}
      {current.unsubscribedAll ? (
        <Alert severity="info">
          {t(
            'This address is unsubscribed from all marketing emails. To start receiving them again, contact the sender.',
          )}
        </Alert>
      ) : (
        <EmailPreferencesForm
          key={JSON.stringify(current)}
          token={token}
          preferences={current}
          onSaved={(message, next) => {
            setCurrent(next);
            setNotice({ severity: 'success', message });
          }}
          onError={(message) => setNotice({ severity: 'error', message })}
        />
      )}
    </Flex>
  );
}

/**
 * The public "Manage email preferences" page: `/email-preferences?t=…`. The token in the
 * email is the only credential — no sign-in — and it can change only its own address.
 */
export function EmailPreferencesPage() {
  const t = useT();
  const [params] = useSearchParams();
  const token = params.get('t') ?? '';
  const { data, loading, error } = useEmailPreferencesQuery({ variables: { token }, skip: !token });
  let body = (
    <Alert severity="warning">
      {t('This link is missing its code. Open the link from the email again.')}
    </Alert>
  );
  if (token && loading) {
    body = <Skeleton variant="rounded" height={160} aria-label={t('Loading your preferences…')} />;
  } else if (token && error) {
    body = <Alert severity="error">{error.message}</Alert>;
  } else if (data) {
    body = <PreferencesBody token={token} preferences={data.emailPreferences} />;
  }
  return (
    <LoginShell>
      {() => (
        <Flex direction="column" spacing={2}>
          <Heading level={4}>{t('Manage email preferences')}</Heading>
          {body}
        </Flex>
      )}
    </LoginShell>
  );
}
