import type { Logger } from '@exyconn/logger';
import { AppProviders } from '../../components/AppProviders';
import { usePrefs } from '../../hooks/usePrefs';
import { FloatingApp } from './FloatingApp';

interface Props {
  logger: Logger;
  shadow: { root: ShadowRoot; portal: HTMLElement };
}

/** The in-Meet app's providers, styled inside its own shadow root. */
export function ContentRoot({ logger, shadow }: Readonly<Props>) {
  const { prefs } = usePrefs();
  if (prefs === null) {
    return null;
  }
  return (
    <AppProviders logger={logger} theme={prefs.theme} shadow={shadow}>
      <FloatingApp prefs={prefs} logger={logger} />
    </AppProviders>
  );
}
