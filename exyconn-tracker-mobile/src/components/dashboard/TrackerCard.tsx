import { Separator, XStack, YStack } from 'tamagui';
import { PresenceForm } from '../../forms/presence';
import type { MobileTrackerState } from '../../tracker/types';
import { Surface } from '../ui/Surface';
import { Body, Caption } from '../ui/Typography';
import { AttendanceGate } from './AttendanceGate';
import { AutoStopNotice } from './AutoStopNotice';
import { ProjectPicker } from './ProjectPicker';
import { StatusChip } from './StatusChip';
import { TicketPicker } from './TicketPicker';
import { TrackingControls } from './TrackingControls';

interface Props {
  state: MobileTrackerState;
}

/**
 * Who is signed in and what the tracker is doing, then everything that decides the next
 * session, in the order it has to happen: attendance, the schedule's hours, the booking, what
 * the employee is doing, and finally the buttons.
 */
export function TrackerCard({ state }: Readonly<Props>) {
  const { status, settings, user, timezone, workday } = state;
  const tracking = status === 'tracking' || status === 'paused';

  return (
    <Surface padding="$4" gap="$4">
      <XStack gap="$3" alignItems="center" justifyContent="space-between">
        <YStack flex={1} minWidth={0}>
          <Body fontWeight="700" numberOfLines={1}>
            {user?.name ?? 'Signed in'}
          </Body>
          <Caption numberOfLines={1}>{user?.email ?? ''}</Caption>
        </YStack>
        <StatusChip status={status} />
      </XStack>

      <AttendanceGate workday={workday} />
      {/* Above the controls: the hour their time stops counting is worth knowing BEFORE they
          press start, not after the schedule has already stopped them. */}
      <AutoStopNotice settings={settings} timezone={timezone} status={status} />
      <ProjectPicker
        projects={state.projects}
        selectedProjectId={state.selectedProjectId}
        disabled={tracking}
      />
      <TicketPicker tasks={state.tasks} selectedTaskId={state.selectedTaskId} disabled={tracking} />
      <Separator borderColor="$hairline" />
      {/* Above the controls, not below: saying "I am at lunch" IS a tracking control — it
          pauses the session — and finding it under the buttons would make it look like a
          status somebody else reads rather than something that acts. */}
      <PresenceForm presence={state.presence} timezone={timezone} />
      <Separator borderColor="$hairline" />
      <TrackingControls status={status} attendanceMarked={workday?.attendanceMarked ?? false} />
    </Surface>
  );
}
