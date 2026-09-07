import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { Heading, Text } from '@exyconn/shell/components/ui';
import { RESET_PASSWORD_PATH } from '@exyconn/shell/app/PortalApp';
import { LoginForm } from './forms/login';
import { LoginShell } from './LoginShell';
import { ResetPasswordPage } from '../ResetPassword/ResetPasswordPage';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { safeNext } from '@exyconn/shell/utils/redirect';

/**
 * The public front door: the sign-in screen, and — on the path a reset email links to —
 * the choose-a-new-password screen. One component serves both so every portal gets the
 * reset flow from the `loginElement` it already passes to the shell.
 */
export function Login() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [params] = useSearchParams();

  // An already-signed-in user never sees the login screen — bounce them to the
  // page they were after (or the portal home).
  if (user) return <Navigate to={safeNext(params.get('next'))} replace />;
  if (pathname === RESET_PASSWORD_PATH) return <ResetPasswordPage />;

  return (
    <LoginShell>
      {(page) => (
        <>
          <Heading level={4} sx={{ mb: 2 }}>
            Sign in to {page.name}
          </Heading>
          <LoginForm accentColor={page.accentColor} />

          <Text size="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Authorized personnel only.
            {page.supportEmail ? ` Need access? ${page.supportEmail}` : ''}
          </Text>
        </>
      )}
    </LoginShell>
  );
}
