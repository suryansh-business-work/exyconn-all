import type { MeetingState, ReminderState, TranscriptionState } from '../types/meeting';

/** The interval the company falls back to when its setting is missing or zero. */
export const DEFAULT_REMINDER_INTERVAL_MINUTES = 2;

/** The intervals a user may pick instead of the company's, in minutes. */
export const USER_REMINDER_INTERVALS = ['1', '2', '5', '10'] as const;
/** `org` keeps the company's interval. */
export type ReminderIntervalChoice = 'org' | (typeof USER_REMINDER_INTERVALS)[number];

const MINUTE_MS = 60_000;

/** The company's switches, merged with the user's own choice of interval. */
export interface ReminderSettings {
  enabled: boolean;
  intervalMinutes: number;
  maxPerMeeting: number;
  snoozeMinutes: number;
}

/** What the page currently says. */
export interface ReminderContext {
  meetingState: MeetingState;
  transcriptionState: TranscriptionState;
}

export type ReminderAction = 'LATER' | 'SNOOZE' | 'DISMISS';

export interface ReminderTick {
  state: ReminderState;
  /** True when a reminder must be shown now (banner and, if enabled, a notification). */
  show: boolean;
}

/** The interval in force: the user's pick, else the company's, else the default. */
export function resolveIntervalMinutes(orgMinutes: number, choice: ReminderIntervalChoice): number {
  if (choice !== 'org') {
    return Number(choice);
  }
  return orgMinutes > 0 ? orgMinutes : DEFAULT_REMINDER_INTERVAL_MINUTES;
}

export function initialReminderState(): ReminderState {
  return { shown: 0, nextAt: null, snoozedUntil: null, dismissed: false, bannerVisible: false };
}

/**
 * Reminders apply only while the user is in the call AND Meet visibly shows transcription
 * off. UNKNOWN never triggers one: the extension does not nag about what it cannot read.
 */
export function remindersApply(settings: ReminderSettings, context: ReminderContext): boolean {
  return (
    settings.enabled &&
    context.meetingState === 'IN_MEETING' &&
    context.transcriptionState === 'OFF'
  );
}

/** Stopped for good (or for now): nothing scheduled, no banner. */
function idle(state: ReminderState): ReminderTick {
  return { state: { ...state, nextAt: null, bannerVisible: false }, show: false };
}

/**
 * One evaluation, run whenever the page state changes or a reminder alarm fires. The first
 * reminder shows as soon as transcription is seen off; the next one an interval later, until
 * the company's cap, a snooze, a dismissal, or transcription coming on.
 */
export function evaluateReminder(
  state: ReminderState,
  settings: ReminderSettings,
  context: ReminderContext,
  now: number,
): ReminderTick {
  if (!remindersApply(settings, context) || state.dismissed) {
    return idle(state);
  }
  if (state.shown >= settings.maxPerMeeting) {
    return idle(state);
  }
  if (state.snoozedUntil !== null && now < state.snoozedUntil) {
    return { state: { ...state, nextAt: state.snoozedUntil, bannerVisible: false }, show: false };
  }
  const due = state.nextAt === null || now >= state.nextAt;
  if (!due) {
    return { state, show: false };
  }
  return {
    state: {
      ...state,
      shown: state.shown + 1,
      nextAt: now + settings.intervalMinutes * MINUTE_MS,
      snoozedUntil: null,
      bannerVisible: true,
    },
    show: true,
  };
}

/**
 * What the user chose on a reminder. Remind later waits one interval; snooze waits the
 * user's snooze minutes; dismiss stops reminders for the rest of this meeting.
 */
export function applyReminderAction(
  state: ReminderState,
  action: ReminderAction,
  settings: ReminderSettings,
  now: number,
): ReminderState {
  if (action === 'DISMISS') {
    return { ...state, dismissed: true, nextAt: null, bannerVisible: false };
  }
  if (action === 'SNOOZE') {
    const until = now + settings.snoozeMinutes * MINUTE_MS;
    return { ...state, snoozedUntil: until, nextAt: until, bannerVisible: false };
  }
  return { ...state, nextAt: now + settings.intervalMinutes * MINUTE_MS, bannerVisible: false };
}
