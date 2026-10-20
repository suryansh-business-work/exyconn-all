import { Button, FormControlLabel, Stack, Switch } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import SettingsIcon from '@mui/icons-material/Settings';
import { askWorker } from '../../../services/messaging';
import { createPrefsStore, type ExtensionPrefs } from '../../../storage/prefs';
import type { TabProps } from './types';
import { logTo } from '../../../services/logger';

type QuickToggle =
  'liveTranscript' | 'participantTracking' | 'desktopNotifications' | 'autoOpenPanel';

const TOGGLES: ReadonlyArray<{ key: QuickToggle; label: string }> = [
  { key: 'liveTranscript', label: 'Show the live transcript' },
  { key: 'participantTracking', label: 'Track participants' },
  { key: 'desktopNotifications', label: 'Desktop notifications' },
  { key: 'autoOpenPanel', label: 'Open the panel when I join a call' },
];

/** A few quick switches, and the way to every other setting. */
export function SettingsTab({ prefs, logger }: Readonly<TabProps>) {
  const t = useT();
  const save = (next: ExtensionPrefs): void => {
    createPrefsStore(chrome.storage.sync)
      .write(next)
      .catch(logTo(logger, 'Could not save a quick setting'));
  };
  const openOptions = (): void => {
    askWorker({ type: 'options/open' }).catch(logTo(logger, 'Could not open settings'));
  };
  return (
    <Stack spacing={1}>
      {TOGGLES.map((toggle) => (
        <FormControlLabel
          key={toggle.key}
          label={t(toggle.label)}
          control={
            <Switch
              checked={prefs[toggle.key]}
              onChange={(_event, checked) => save({ ...prefs, [toggle.key]: checked })}
            />
          }
        />
      ))}
      <Button variant="outlined" startIcon={<SettingsIcon />} onClick={openOptions}>
        {t('All settings')}
      </Button>
    </Stack>
  );
}
