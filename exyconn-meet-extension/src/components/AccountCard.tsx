import { Alert, Button, Stack, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import type { Logger } from '@exyconn/logger';
import LogoutIcon from '@mui/icons-material/Logout';
import type { AuthSnapshot } from '../types/messages';
import { useAuthActions } from './useAuthActions';
import { SignInForm } from './forms/sign-in';

interface Props {
  auth: AuthSnapshot;
  logger: Logger;
  onChanged: () => void;
}

/**
 * Who the extension is signed in as, with sign-out — or the sign-in form, right here: the
 * portal email and password (and two-factor code), with no portal page or pop-up window.
 */
export function AccountCard({ auth, logger, onChanged }: Readonly<Props>) {
  const t = useT();
  const { busy, error, signOut, submitPassword, submitCode } = useAuthActions(logger, onChanged);
  const errorAlert = error === null ? null : <Alert severity="error">{t(error)}</Alert>;

  if (!auth.signedIn || auth.org === null) {
    return (
      <SignInForm submitPassword={submitPassword} submitCode={submitCode} onSignedIn={onChanged} />
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
