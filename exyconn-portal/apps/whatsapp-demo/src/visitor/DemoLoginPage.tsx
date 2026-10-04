import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Heading, Link, Text } from '@exyconn/shell/components/ui';
import { RESET_PASSWORD_PATH, UNSUBSCRIBE_PATH } from '@exyconn/shell/app/PortalApp';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { HUB_URL } from '@exyconn/shell/config/apps';
import { safeNext } from '@exyconn/shell/utils/redirect';
import { Login, LoginShell } from '@exyconn/login';
import { DemoSignInForm } from './forms/demo-sign-in';
import { storeVisitorPass } from './visitorPass';
import { useVisitor } from './useVisitor';
import { HOME_PATH } from '../paths';

/**
 * The WhatsApp demo's front door: email and a one-time code, no password. Only this app signs
 * in this way; every other portal keeps its password sign-in. Staff who run the demo's admin
 * screens sign in to the portal as usual — the session is shared across the portals.
 */
export function DemoLoginPage() {
  const t = useT();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { visitor } = useVisitor();
  const next = safeNext(params.get('next'));
  // A visitor only ever has the chats; sending one on to /admin would bounce straight back here.
  const visitorNext = next.startsWith(HOME_PATH) ? next : HOME_PATH;

  // An emailed reset or unsubscribe link is a portal account's business, answered as anywhere else.
  if (pathname === RESET_PASSWORD_PATH || pathname === UNSUBSCRIBE_PATH) return <Login />;
  if (user) return <Navigate to={next} replace />;
  if (visitor) return <Navigate to={visitorNext} replace />;

  const signedIn = (pass: string) => {
    storeVisitorPass(pass);
    navigate(visitorNext, { replace: true });
  };

  return (
    <LoginShell>
      {(page) => (
        <>
          <Heading level={4} sx={{ mb: 1 }}>
            {t('Try the live WhatsApp demo')}
          </Heading>
          <Text size="sm" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {t('Sign in with your email and a one-time code to chat with every demo bot.')}
          </Text>
          <DemoSignInForm accentColor={page.accentColor} onSignedIn={signedIn} />
          <Text size="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            {t('Exyconn staff?')}{' '}
            <Link href={HUB_URL} variant="caption">
              {t('Sign in to the portal')}
            </Link>
          </Text>
        </>
      )}
    </LoginShell>
  );
}
