import { toZonedTime } from 'date-fns-tz';

/** One weekday's opening hours, as Website > Chatbot > Settings stores them. */
export interface ChatDay {
  day: number;
  enabled: boolean;
  start: string;
  end: string;
}

export interface ChatHours {
  timezone: string;
  weeklyHours: ChatDay[];
}

const toMinutes = (hhmm: string): number => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};

/**
 * Whether one day's hours cover the moment. A day whose end is earlier than its start runs
 * past midnight, so its late part is checked against the day after.
 */
function covers(day: ChatDay, today: number, minutes: number): boolean {
  const start = toMinutes(day.start);
  const end = toMinutes(day.end);
  if (start < end) {
    return day.day === today && minutes >= start && minutes < end;
  }
  const yesterday = (today + 6) % 7;
  return (day.day === today && minutes >= start) || (day.day === yesterday && minutes < end);
}

/** Whether the team is on duty right now, read in the settings' own timezone. */
export function isWithinHours(hours: ChatHours, now: Date = new Date()): boolean {
  const local = toZonedTime(now, hours.timezone);
  const minutes = local.getHours() * 60 + local.getMinutes();
  const today = local.getDay();
  return hours.weeklyHours.some((day) => day.enabled && covers(day, today, minutes));
}
