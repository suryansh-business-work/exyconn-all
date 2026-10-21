import { Alert, Button, Stack, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import type { Logger } from '@exyconn/logger';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import type { AuthSnapshot } from '../types/messages';
import { useAuthActions } from './useAuthActions';

interface Props {
  auth: AuthSnapshot;
  logger: Logger;
  onChanged: () => void;
}

/**
 * Who the extension is signed in as, with sign-out — or the sign-in button. Signing in opens
 * the portal's own sign-in page; the extension never handles a password.
 */
export function AccountCard({ auth, logger, onChanged }: Readonly<Props>) {
  const t = useT();
  const { busy, error, signIn, signOut } = useAuthActions(logger, onChanged);
  const errorAlert = error === null ? null : <Alert severity="error">{t(error)}</Alert>;

  if (!auth.signedIn || auth.org === null) {
    return (
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          {t('Sign in with your Exyconn account to get meeting notes and action items.')}
        </Typography>
        {errorAlert}
        <Button variant="contained" startIcon={<LoginIcon />} onClick={signIn} disabled={busy}>
          {t('Sign in with Exyconn')}
        </Button>
      </Stack>
    );
  }
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{auth.org.name}</Typography>
      <Typography variant="body2" color="text.secondary">
        {auth.org.email} · {auth.org.organizationName}
      </Typography>
      {auth.org.enabled ? null : (
        <Alert severity="warning">
          {t('Meeting transcription is turned off for your company')}
        </Alert>
      )}
      {errorAlert}
      <Button variant="outlined" startIcon={<LogoutIcon />} onClick={signOut} disabled={busy}>
        {t('Sign out')}
      </Button>
    </Stack>
  );
}
