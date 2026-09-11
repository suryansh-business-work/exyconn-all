import { Separator, YStack } from 'tamagui';
import type { TrackerSettings } from '@exyconn/tracker-core';
import type { MobilePreferences } from '../../tracker/types';
import { Body } from '../ui/Typography';
import { CaptureSoundPreference } from './CaptureSoundPreference';
import { ProgressStylePicker } from './ProgressStylePicker';
import { SettingsCard } from './SettingsCard';
import { ThemeModePicker } from './ThemeModePicker';
import { TransparencyPreference } from './TransparencyPreference';
import { UpdateSection } from './UpdateSection';

interface Props {
  /** This install's own preferences — the employee's, not the administrator's. */
  preferences: MobilePreferences;
  settings: TrackerSettings | null;
}

/**
 * The employee's own choices: they decide how this app behaves, never what it records. The
 * desktop's tray and window preferences have no phone equivalent, so they are not here.
 */
export function ThisPhoneCard({ preferences, settings }: Readonly<Props>) {
  return (
    <SettingsCard title="This app" description="How the tracker behaves on this phone.">
      <CaptureSoundPreference muted={preferences.muteCaptureSound} settings={settings} />
      <Separator borderColor="$hairline" />
      <YStack gap="$2">
        <Body fontWeight="600">Appearance</Body>
        <ThemeModePicker mode={preferences.themeMode} />
      </YStack>
      <TransparencyPreference
        transparent={preferences.transparentBackground}
        opacity={preferences.backgroundOpacity}
      />
      <YStack gap="$2">
        <Body fontWeight="600">Today’s progress</Body>
        <ProgressStylePicker progressStyle={preferences.progressStyle} />
      </YStack>
      <Separator borderColor="$hairline" />
      <UpdateSection />
    </SettingsCard>
  );
}
