import type { ReactElement } from 'react';
import { Divider, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import type { AppPreferences, TrackerSettings, UpdateState } from '@shared/types';
import Surface from './Surface';
import TrayPreference from './TrayPreference';
import CaptureSoundPreference from './CaptureSoundPreference';
import ThemeModePicker from './ThemeModePicker';
import TransparencyPreference from './TransparencyPreference';
import ProgressStylePicker from './ProgressStylePicker';
import UpdatePreference from './UpdatePreference';

interface Props {
  preferences: AppPreferences;
  settings: TrackerSettings | null;
  update: UpdateState;
}

/** The employee's own choices for this computer: they decide how it behaves, never what it records. */
export default function AppPreferencesCard({
  preferences,
  settings,
  update,
}: Readonly<Props>): ReactElement {
  const t = useT();
  return (
    <Surface sx={{ p: 2.5 }}>
      <Typography variant="h6" component="h2">
        {t('This app')}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 2 }}>
        {t('How the tracker behaves on this computer.')}
      </Typography>
      <TrayPreference preferences={preferences} />
      <Divider sx={{ my: 2 }} />
      <CaptureSoundPreference preferences={preferences} settings={settings} />
      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {t('Appearance')}
      </Typography>
      <ThemeModePicker mode={preferences.themeMode} />
      <TransparencyPreference preferences={preferences} />
      <Typography variant="body2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
        {t('Today’s progress')}
      </Typography>
      <ProgressStylePicker style={preferences.progressStyle} />
      <Divider sx={{ my: 2 }} />
      <UpdatePreference preferences={preferences} update={update} />
    </Surface>
  );
}
