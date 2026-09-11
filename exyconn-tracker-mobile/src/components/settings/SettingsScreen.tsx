import { Linking } from 'react-native';
import type { MobileTrackerState } from '../../tracker/types';
import { ScreenLayout } from '../ui/ScreenLayout';
import { AboutCard } from './AboutCard';
import { CapabilityCard } from './CapabilityCard';
import { SettingsCard } from './SettingsCard';
import { MY_DATA_URL } from '../../tracker/config';
import { run } from '../../tracker/run';
import { SignOutButton } from '../shell/SignOutButton';
import { AppButton } from '../ui/AppButton';
import { ThisPhoneCard } from './ThisPhoneCard';
import { TimezonePicker } from './TimezonePicker';
import { WorkArrangementCard } from './WorkArrangementCard';
import { WorkspaceSettingsCard } from './WorkspaceSettingsCard';

interface Props {
  state: MobileTrackerState;
}

/**
 * Settings & About: the employee's own choices first (their zone, how this app behaves), then
 * what HR and the administrator set — read-only — then what this phone can record, the way
 * out, and who makes the app.
 */
export function SettingsScreen({ state }: Readonly<Props>) {
  return (
    <ScreenLayout>
      {/* The one setting here that is the EMPLOYEE'S and follows them to every device. */}
      <SettingsCard
        title="Your timezone"
        description="Your workspace sets a default. Pick your own if you work somewhere else."
      >
        <TimezonePicker timezone={state.timezone} />
      </SettingsCard>
      <ThisPhoneCard preferences={state.preferences} settings={state.settings} />
      <WorkArrangementCard workProfile={state.workProfile} />
      <WorkspaceSettingsCard settings={state.settings} />
      <CapabilityCard settings={state.settings} />
      <SettingsCard
        title="Your data"
        description="Everything this app has recorded about you is visible to you in the portal."
      >
        <AppButton
          label="View my data in the portal"
          icon="open-in-new"
          full
          onPress={() => run(() => Linking.openURL(MY_DATA_URL))}
        />
        <SignOutButton status={state.status} pendingSync={state.stats.pendingSync} />
      </SettingsCard>
      <AboutCard branding={state.branding} />
    </ScreenLayout>
  );
}
