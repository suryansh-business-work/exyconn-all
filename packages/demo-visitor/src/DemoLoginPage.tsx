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

export interface DemoLoginPageProps {
  /** The page heading, e.g. "Try the live WhatsApp demo" (translated here). */
  title: string;
  /** One line under it on what signing in opens (translated here). */
  subtitle: string;
  /** Where a visitor lands when the address they asked for is not theirs to open. */
  homePath: string;
  /** Whether a visitor may be sent on to this in-app path; staff-only areas say no. */
  isVisitorPath?: (path: string) => boolean;
}

const anyPath = () => true;

/**
 * A demo's front door: email and a one-time code, no password. Only the demos sign in this
 * way; every portal keeps its password sign-in. Staff who run a demo's admin screens sign in to
 * the portal as usual — the session is shared across the portals.
 */
export function DemoLoginPage({
  title,
  subtitle,
  homePath,
  isVisitorPath = anyPath,
}: Readonly<DemoLoginPageProps>) {
  const t = useT();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { visitor } = useVisitor();
  const next = safeNext(params.get('next'));
  // A visitor only ever has the demo; sending one on to a staff area would bounce back here.
  const visitorNext = isVisitorPath(next) ? next : homePath;

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
            {t(title)}
          </Heading>
          <Text size="sm" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {t(subtitle)}
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
