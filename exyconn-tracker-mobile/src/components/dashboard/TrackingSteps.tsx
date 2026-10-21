import type { ReactNode } from 'react';
import { YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { trackingSteps, type TrackingStepId } from '@exyconn/tracker-core';
import { PresenceForm } from '../../forms/presence';
import type { MobileTrackerState } from '../../tracker/types';
import { Notice } from '../ui/Notice';
import { AttendanceGate } from './AttendanceGate';
import { ProjectPicker } from './ProjectPicker';
import { TicketPicker } from './TicketPicker';
import { TimelineStep } from './TimelineStep';

interface Props {
  state: MobileTrackerState;
  /** `offDayMessage(workday, t)`, or null on a working day. */
  offDay: string | null;
}

/**
 * Attendance, then the booking, then what the employee is doing — as a vertical timeline in the
 * order it has to happen, exactly as the desktop's Stepper draws it. Every step's form stays
 * open, so the project and status can still be changed while tracking; the step states come
 * from `trackingSteps`, shared with the desktop.
 */
export function TrackingSteps({ state, offDay }: Readonly<Props>) {
  const t = useT();
  const { workday, status, timezone } = state;
  const tracking = status === 'tracking' || status === 'paused';
  const steps = trackingSteps({
    attendanceMarked: workday?.attendanceMarked ?? false,
    offDay: offDay !== null,
    selectedProjectId: state.selectedProjectId,
    presence: state.presence.status,
  });

  const bodies: Readonly<Record<TrackingStepId, ReactNode>> = {
    attendance:
      offDay === null ? (
        <AttendanceGate workday={workday} />
      ) : (
        <Notice severity="info" icon="calendar-remove-outline">
          {offDay}
        </Notice>
      ),
    project: (
      <YStack gap="$4">
        <ProjectPicker
          projects={state.projects}
          selectedProjectId={state.selectedProjectId}
          disabled={tracking}
          loading={workday === null}
        />
        <TicketPicker
          tasks={state.tasks}
          selectedTaskId={state.selectedTaskId}
          disabled={tracking}
          loading={state.tasksLoading}
        />
      </YStack>
    ),
    // Saying "I am at lunch" IS a tracking control — it pauses the session — so it sits
    // above the buttons, not under them.
    status: <PresenceForm presence={state.presence} timezone={timezone} />,
  };

  return (
    <YStack>
      {steps.map((step, index) => (
        <TimelineStep
          key={step.id}
          number={index + 1}
          title={t(step.title)}
          hint={step.hint === null ? null : t(step.hint)}
          state={step.state}
          last={index === steps.length - 1}
        >
          {bodies[step.id]}
        </TimelineStep>
      ))}
    </YStack>
  );
}
