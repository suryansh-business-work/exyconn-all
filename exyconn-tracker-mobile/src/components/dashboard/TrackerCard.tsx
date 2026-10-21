import { Separator, XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { offDayMessage } from '@exyconn/tracker-core';
import type { MobileTrackerState } from '../../tracker/types';
import { Surface } from '../ui/Surface';
import { Body, Caption } from '../ui/Typography';
import { AutoStopNotice } from './AutoStopNotice';
import { StatusChip } from './StatusChip';
import { TrackingControls } from './TrackingControls';
import { TrackingSteps } from './TrackingSteps';

interface Props {
  state: MobileTrackerState;
}

/**
 * Who is signed in and what the tracker is doing, then everything that decides the next
 * session as a three-step timeline in the order it has to happen (attendance, the booking,
 * what the employee is doing), then the schedule's hours and finally the buttons. On an off
 * day (week off, holiday, leave) the attendance gate and the buttons give way to one sentence
 * saying why tracking is paused.
 */
export function TrackerCard({ state }: Readonly<Props>) {
  const t = useT();
  const { status, settings, user, timezone, workday } = state;
  // Once, here: the gate and the controls both hang off it.
  const offDay = workday === null ? null : offDayMessage(workday, t);

  return (
    <Surface padding="$4" gap="$4">
      <XStack gap="$3" alignItems="center" justifyContent="space-between">
        <YStack flex={1} minWidth={0}>
          <Body fontWeight="700" numberOfLines={1}>
            {user?.name ?? t('Signed in')}
          </Body>
          <Caption numberOfLines={1}>{user?.email ?? ''}</Caption>
        </YStack>
        <StatusChip status={status} />
      </XStack>

      <TrackingSteps state={state} offDay={offDay} />
      {/* Above the controls: the hour their time stops counting is worth knowing BEFORE they
          press start, not after the schedule has already stopped them. */}
      <AutoStopNotice settings={settings} timezone={timezone} status={status} />
      <Separator borderColor="$hairline" />
      {offDay === null ? (
        <TrackingControls
          status={status}
          attendanceMarked={workday?.attendanceMarked ?? false}
          workday={workday}
        />
      ) : null}
    </Surface>
  );
}
