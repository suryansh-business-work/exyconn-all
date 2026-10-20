import type { Logger } from '@exyconn/logger';
import { AppProviders } from '../components/AppProviders';
import { usePrefs } from '../hooks/usePrefs';
import { DEFAULT_PREFS } from '../storage/prefs';
import { OptionsApp } from './OptionsApp';

export function OptionsRoot({ logger }: Readonly<{ logger: Logger }>) {
  const { prefs, error } = usePrefs();
  return (
    <AppProviders logger={logger} theme={(prefs ?? DEFAULT_PREFS).theme}>
      <OptionsApp prefs={prefs} prefsError={error} logger={logger} />
    </AppProviders>
  );
}
