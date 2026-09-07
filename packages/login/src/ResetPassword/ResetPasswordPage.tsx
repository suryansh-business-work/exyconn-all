import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { Alert, Heading, Link, Text } from '@exyconn/shell/components/ui';
import { LoginShell } from '../Login/LoginShell';
import { ResetPasswordForm } from './forms/reset-password';

/** What a link with no token gets: the way back to asking for a fresh one. */
function MissingToken() {
  return (
    <Alert severity="warning">
      This link is missing its reset token. Open the link from the email again, or request a new one
      from the sign-in page.
    </Alert>
  );
}

/**
 * The screen a reset email links to: `/reset-password?token=…`. Public, because the
 * person opening it is exactly the person who cannot sign in.
 */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  return (
    <LoginShell>
      {(page) => (
        <>
          <Heading level={4} sx={{ mb: 2 }}>
            Choose a new password
          </Heading>
          {token ? (
            <ResetPasswordForm token={token} accentColor={page.accentColor} />
          ) : (
            <MissingToken />
          )}
          <Text size="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            <Link component={RouterLink} to="/login" variant="caption">
              Back to sign in
            </Link>
          </Text>
        </>
      )}
    </LoginShell>
  );
}
