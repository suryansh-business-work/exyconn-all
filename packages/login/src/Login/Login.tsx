import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { Heading, Text } from '@exyconn/shell/components/ui';
import { RESET_PASSWORD_PATH, UNSUBSCRIBE_PATH } from '@exyconn/shell/app/PortalApp';
import { LoginForm } from './forms/login';
import { LoginShell } from './LoginShell';
import { ResetPasswordPage } from '../ResetPassword/ResetPasswordPage';
import { UnsubscribePage } from '../Unsubscribe/UnsubscribePage';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { safeNext } from '@exyconn/shell/utils/redirect';

/**
 * The public front door: the sign-in screen, and — on the paths an email links to — the
 * choose-a-new-password and unsubscribe screens. One component serves all three so every
 * portal gets them from the `loginElement` it already passes to the shell.
 */
export function Login() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [params] = useSearchParams();

  // Unsubscribing is a recipient's business, not an account holder's, so it is answered
  // before the signed-in redirect — otherwise a colleague who happens to be logged in
  // would be bounced to a dashboard instead of being unsubscribed.
  if (pathname === UNSUBSCRIBE_PATH) return <UnsubscribePage />;
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
