import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Heading, Text } from '@exyconn/shell/components/ui';
import { safeNext } from '@exyconn/shell/utils/redirect';
import { LoginShell } from '@exyconn/login';
import { ClientSignInForm } from './forms/client-sign-in';
import { clientPass } from './clientPass';
import { PATHS } from '../paths';

/** The client hub's front door: work email and a one-time code. */
export function ClientLoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requested = safeNext(params.get('next'));
  const next = requested === '/' ? PATHS.dashboard : requested;

  if (clientPass.has()) return <Navigate to={next} replace />;

  const signedIn = (pass: string) => {
    clientPass.store(pass);
    navigate(next, { replace: true });
  };

  return (
    <LoginShell>
      {(page) => (
        <>
          <Heading level={4} sx={{ mb: 1 }}>
            {t('Sign in to your client hub')}
          </Heading>
          <Text size="sm" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {t(
              'Pay invoices, download statements, raise support tickets and follow your projects.',
            )}
          </Text>
          <ClientSignInForm accentColor={page.accentColor} onSignedIn={signedIn} />
          <Text size="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            {t('No access yet? Ask your Exyconn account manager to add your email.')}
          </Text>
        </>
      )}
    </LoginShell>
  );
}
