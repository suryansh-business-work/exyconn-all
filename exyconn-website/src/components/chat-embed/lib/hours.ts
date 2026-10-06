import type { OpeningDay } from "../types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Today's weekday (0 = Sunday) where the team works, which may not be where the visitor is. */
function weekdayIn(timezone: string): number {
  const name = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: timezone }).format(
    new Date()
  );
  return Math.max(0, WEEKDAYS.indexOf(name));
}

/** The team's timezone as a short label, e.g. "GMT+5:30". */
function zoneLabel(timezone: string): string {
  const parts = new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    timeZoneName: "short",
  }).formatToParts(new Date());
  return parts.find((part) => part.type === "timeZoneName")?.value ?? timezone;
}

export interface TodayHours {
  open: boolean;
  start: string;
  end: string;
  zone: string;
}

/** The team's opening hours today, in its own timezone; null when the timezone is unknown. */
export function todayHours(days: readonly OpeningDay[], timezone: string): TodayHours | null {
  try {
    const today = days.find((day) => day.day === weekdayIn(timezone));
    return {
      open: Boolean(today?.enabled),
      start: today?.start ?? "",
      end: today?.end ?? "",
      zone: zoneLabel(timezone),
    };
  } catch (error) {
    console.warn("[chat] could not read the opening hours", error);
    return null;
  }
}
