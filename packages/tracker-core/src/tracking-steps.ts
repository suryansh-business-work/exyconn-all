import { presenceLabel } from './presence';
import type { PresenceStatus } from './types';

/** The three things the dashboard asks for before (and while) a session runs, in order. */
export type TrackingStepId = 'attendance' | 'project' | 'status';

/**
 * Where one step stands. `active` is open for input, `complete` is done but still editable, and
 * `locked` is shown but not editable until an earlier step is done.
 */
export type TrackingStepState = 'active' | 'complete' | 'locked';

export interface TrackingStep {
  id: TrackingStepId;
  /** English source string — the catalogue key; translate it with `t`. */
  title: string;
  state: TrackingStepState;
  /** English line under the title (why it is locked, or what it says now); null for none. */
  hint: string | null;
}

export interface TrackingStepsInput {
  /** Today's attendance is marked — the gate tracking sits behind. */
  attendanceMarked: boolean;
  /** Today is off (week off, holiday, leave): there is nothing to mark, so nothing waits on it. */
  offDay: boolean;
  /** The project the next session books to; empty when none is chosen. */
  selectedProjectId: string;
  /** What the employee currently says they are doing. */
  presence: PresenceStatus;
}

const LOCKED_HINT = 'Mark your attendance first.';

/**
 * The dashboard's step timeline — the same list, titles and states on the laptop and the phone.
 * Project and status wait on attendance (tracking already does); once it is marked, or on an off
 * day when there is nothing to mark, both stay editable for the rest of the day.
 */
export function trackingSteps(input: TrackingStepsInput): TrackingStep[] {
  const gated = !input.offDay && !input.attendanceMarked;
  let projectState: TrackingStepState = 'active';
  if (gated) {
    projectState = 'locked';
  } else if (input.selectedProjectId !== '') {
    projectState = 'complete';
  }
  return [
    {
      id: 'attendance',
      title: 'Mark attendance & location',
      // On an off day it stays active: its body is the off-day banner, not a form.
      state: input.attendanceMarked ? 'complete' : 'active',
      hint: null,
    },
    { id: 'project', title: 'Project', state: projectState, hint: gated ? LOCKED_HINT : null },
    {
      id: 'status',
      title: 'My status',
      state: gated ? 'locked' : 'active',
      hint: gated ? LOCKED_HINT : presenceLabel(input.presence),
    },
  ];
}
