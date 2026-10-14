import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Stack, Text } from '@exyconn/shell/components/ui';
import {
  EmailVerificationSource,
  useVerifyEmailMutation,
  type EmailVerificationFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { EmailCheckForm } from './forms/email-check';
import { EmailCheckResult } from './EmailCheckResult';

/** Check one address now; the result is kept in Records and shown beside it across the CRM. */
export function SingleCheckPanel() {
  const t = useT();
  const [verify, { loading }] = useVerifyEmailMutation();
  const [result, setResult] = useState<EmailVerificationFieldsFragment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = async (email: string) => {
    setError(null);
    try {
      const { data } = await verify({
        variables: { email, source: EmailVerificationSource.Single },
      });
      setResult(data?.verifyEmail ?? null);
    } catch (failure) {
      setError(errorMessage(failure, t('Could not check the email')));
    }
  };

  return (
    <Stack spacing={2}>
      <Text color="text.secondary">
        {t(
          'A check takes a few seconds: the domain is looked up and its mail server asked about the mailbox.',
        )}
      </Text>
      <EmailCheckForm checking={loading} onCheck={check} />
      {error && <Alert severity="error">{error}</Alert>}
      {result && <EmailCheckResult result={result} />}
    </Stack>
  );
}
