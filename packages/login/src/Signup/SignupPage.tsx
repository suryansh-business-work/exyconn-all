import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Heading, Link, Text } from '@exyconn/shell/components/ui';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { useSignupPlansQuery } from '@exyconn/shell/graphql/generated';
import { LoginShell } from '../Login/LoginShell';
import { SignupForm, type SignupFormValues } from './forms/signup';
import { SignupCodeForm } from './forms/signup-code';

/** The plans, the first step, or the code step — whichever the sign-up has reached. */
function SignupSteps({ accentColor }: Readonly<{ accentColor: string }>) {
  const t = useT();
  const { data, loading, error } = useSignupPlansQuery();
  const [details, setDetails] = useState<SignupFormValues | null>(null);
  const plans = data?.signupPlans ?? [];

  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <Alert severity="error">{t('The plans could not be loaded. Try again shortly.')}</Alert>;
  }
  if (plans.length === 0) {
    return (
      <Alert severity="info">{t('Sign-up is not open yet. Contact us to get started.')}</Alert>
    );
  }
  if (details) {
    return (
      <SignupCodeForm
        details={details}
        accentColor={accentColor}
        onStartOver={() => setDetails(null)}
      />
    );
  }
  return <SignupForm plans={plans} accentColor={accentColor} onCodeSent={setDetails} />;
}

/**
 * Self sign-up: a company and its administrator, proved by an emailed code. The server creates
 * the company exactly as a platform administrator would, starts the chosen plan's trial and
 * signs the administrator straight in.
 */
export function SignupPage() {
  const t = useT();
  return (
    <LoginShell>
      {(page) => (
        <>
          <Heading level={4} sx={{ mb: 2 }}>
            {t('Create your company')}
          </Heading>
          <SignupSteps accentColor={page.accentColor} />
          <Text size="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            {t('Already have an account?')}{' '}
            <Link component={RouterLink} to="/login">
              {t('Sign in')}
            </Link>
          </Text>
        </>
      )}
    </LoginShell>
  );
}
