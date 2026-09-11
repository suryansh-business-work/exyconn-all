import { YStack } from 'tamagui';
import { sessionTiles } from '../../lib/dashboard/session-tiles';
import { capabilities } from '../../tracker/platform';
import type { MobileTrackerState } from '../../tracker/types';
import { ScreenLayout } from '../ui/ScreenLayout';
import { Surface } from '../ui/Surface';
import { CapabilityNotice } from './CapabilityNotice';
import { DayProgress } from './DayProgress';
import { SectionHeading } from './SectionHeading';
import { StatGrid } from './StatGrid';
import { SyncBar } from './SyncBar';
import { TodayActivity } from './TodayActivity';
import { TotalsPanel } from './TotalsPanel';
import { TrackerCard } from './TrackerCard';

interface Props {
  state: MobileTrackerState;
}

/**
 * The day, then the controls, then TWO clearly separated blocks of numbers: the live counters
 * for the session in progress, and the employee's all-time totals from the portal. They are
 * never merged into one grid — a number that resets and a number that never does are
 * different facts, and each block's heading says which it is.
 *
 * The day's progress sits at the top because it is the one number the employee is actually
 * working towards; everything below it explains how that number is being made. On an iPhone,
 * what the phone cannot record is said above even that.
 */
export function DashboardScreen({ state }: Readonly<Props>) {
  const { stats, settings, timezone, workday, workProfile, preferences } = state;

  return (
    <ScreenLayout>
      <CapabilityNotice />
      <Surface padding="$4">
        <DayProgress
          workday={workday}
          workProfile={workProfile}
          activeMs={stats.dayActiveMs}
          style={preferences.progressStyle}
        />
      </Surface>

      <TrackerCard state={state} />

      <TodayActivity timezone={timezone} lastSyncAt={stats.lastSyncAt} />

      <SyncBar stats={stats} settings={settings} timezone={timezone} />

      <YStack gap="$3">
        <SectionHeading
          title="This session"
          caption="Live counters for the run in progress — they reset to zero when you stop."
        />
        <StatGrid tiles={sessionTiles(stats, settings, capabilities)} />
      </YStack>

      <TotalsPanel lastSyncAt={stats.lastSyncAt} />
    </ScreenLayout>
  );
}
