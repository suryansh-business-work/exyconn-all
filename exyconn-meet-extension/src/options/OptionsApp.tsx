import { Alert, CircularProgress, Container, Paper, Stack, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import type { Logger } from '@exyconn/logger';
import { AccountCard } from '../components/AccountCard';
import { useWorkerState } from '../hooks/useWorkerState';
import { createPrefsStore, type ExtensionPrefs } from '../storage/prefs';
import { ExtensionSettingsForm } from './forms/extension-settings';
import { requestMicrophone } from './microphone';

interface Props {
  prefs: ExtensionPrefs | null;
  prefsError: Error | null;
  logger: Logger;
}

const savePrefs = (values: ExtensionPrefs): Promise<void> =>
  createPrefsStore(chrome.storage.sync).write(values);

/** The options page: the signed-in account, then the user's own settings. */
export function OptionsApp({ prefs, prefsError, logger }: Readonly<Props>) {
  const t = useT();
  const { state, refresh } = useWorkerState(null, logger);
  const org = state?.auth.org ?? null;

  let settings = <CircularProgress aria-label={t('Loading')} size={24} />;
  if (prefsError !== null) {
    settings = <Alert severity="error">{t('Could not read your settings')}</Alert>;
  } else if (prefs !== null) {
    settings = (
      <ExtensionSettingsForm
        initial={prefs}
        org={org}
        onSave={savePrefs}
        requestMicrophone={requestMicrophone}
      />
    );
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h5" component="h1">
          {t('Exyconn Meeting Assistant')}
        </Typography>
        <Paper sx={{ p: 2 }} component="section" aria-labelledby="account-title">
          <Stack spacing={1.5}>
            <Typography id="account-title" variant="h6" component="h2">
              {t('Account')}
            </Typography>
            {state === null ? (
              <CircularProgress aria-label={t('Loading')} size={24} />
            ) : (
              <AccountCard auth={state.auth} logger={logger} onChanged={refresh} />
            )}
          </Stack>
        </Paper>
        <Paper sx={{ p: 2 }} component="section">
          {settings}
        </Paper>
      </Stack>
    </Container>
  );
}
