import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Button, Divider } from '@exyconn/shell/components/ui';
import GoogleIcon from '@mui/icons-material/Google';
import {
  useGoogleSignInEnabledQuery,
  useStartGoogleSignInMutation,
} from '@exyconn/shell/graphql/generated';
import { GOOGLE_PARAMS } from './useGoogleTicket';

/** This page without the outcome of an earlier Google attempt, so a retry starts clean. */
function returnAddress(): string {
  const url = new URL(window.location.href);
  GOOGLE_PARAMS.forEach((param) => url.searchParams.delete(param));
  return url.toString();
}

/**
 * "Continue with Google", shown only when Tech has switched Google sign-in on. It sends the
 * browser to Google; the callback brings it back here with a ticket (see useGoogleTicket).
 */
export function GoogleSignInButton({ onError }: Readonly<{ onError: (message: string) => void }>) {
  const t = useT();
  const { data } = useGoogleSignInEnabledQuery();
  const [start] = useStartGoogleSignInMutation();
  const [leaving, setLeaving] = useState(false);

  if (!data?.googleSignInEnabled) {
    return null;
  }

  const onClick = async () => {
    setLeaving(true);
    try {
      const { data: started } = await start({ variables: { returnTo: returnAddress() } });
      if (started?.startGoogleSignIn) {
        window.location.assign(started.startGoogleSignIn);
      }
    } catch (err) {
      setLeaving(false);
      onError(err instanceof Error ? err.message : t('Google sign-in failed'));
    }
  };

  return (
    <>
      <Divider>{t('or')}</Divider>
      <Button
        type="button"
        fullWidth
        variant="outlined"
        startIcon={<GoogleIcon />}
        loading={leaving}
        onClick={onClick}
      >
        {t('Continue with Google')}
      </Button>
    </>
  );
}
