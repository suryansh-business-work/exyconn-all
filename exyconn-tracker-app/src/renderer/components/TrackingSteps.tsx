import type { ReactElement, ReactNode } from 'react';
import { Box, Stack, Step, StepContent, StepLabel, Stepper, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import { trackingSteps, type TrackingStepId } from '@exyconn/tracker-core';
import type { TrackerState } from '@shared/types';
import AttendanceGate from './AttendanceGate';
import OffDayBanner from './OffDayBanner';
import PresencePicker from './PresencePicker';
import ProjectPicker from './ProjectPicker';
import TicketPicker from './TicketPicker';

interface Props {
  state: TrackerState;
  /** `offDayMessage(workday, t)`, or null on a working day. */
  offDay: string | null;
}

interface BodyProps {
  locked: boolean;
  children: ReactNode;
}

/**
 * A step's form. A locked one stays on screen so the employee sees what comes next, but is
 * `inert` — not focusable, not clickable — until attendance is marked.
 */
function StepBody({ locked, children }: Readonly<BodyProps>): ReactElement {
  return (
    <Box
      inert={locked}
      sx={{ pt: 1, opacity: (theme) => (locked ? theme.palette.action.disabledOpacity : 1) }}
    >
      {children}
    </Box>
  );
}

/**
 * Attendance, then the booking, then what the employee is doing — as a vertical timeline in the
 * order it has to happen. Every allowed step stays expanded, so the project and status can still
 * be changed while tracking; the step states come from `trackingSteps`, shared with the phone.
 */
export default function TrackingSteps({ state, offDay }: Readonly<Props>): ReactElement {
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
      offDay === null ? <AttendanceGate workday={workday} /> : <OffDayBanner message={offDay} />,
    project: (
      <Stack spacing={1.75}>
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
      </Stack>
    ),
    // Saying "I am at lunch" IS a tracking control — it pauses the session — so it sits
    // above the buttons, not under them.
    status: <PresencePicker presence={state.presence} timezone={timezone} />,
  };

  return (
    <Stepper orientation="vertical" nonLinear>
      {steps.map((step) => {
        const locked = step.state === 'locked';
        const hint =
          step.hint === null ? undefined : (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t(step.hint)}
            </Typography>
          );
        return (
          <Step
            key={step.id}
            active={step.state === 'active'}
            completed={step.state === 'complete'}
            disabled={locked}
            expanded
          >
            <StepLabel optional={hint}>{t(step.title)}</StepLabel>
            <StepContent>
              <StepBody locked={locked}>{bodies[step.id]}</StepBody>
            </StepContent>
          </Step>
        );
      })}
    </Stepper>
  );
}
