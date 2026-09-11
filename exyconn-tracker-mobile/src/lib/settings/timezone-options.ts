import { offsetLabel, offsetMinutes, timezoneNames } from '@exyconn/tracker-core';

/** One row of the zone picker: the IANA name, with its current UTC offset beneath it. */
export interface TimezoneOption {
  value: string;
  label: string;
  caption: string;
}

/**
 * Every zone the runtime knows (plus `current` and this device's — core's `timezoneNames`),
 * ordered west to east by their offset right now, then by name. ~400 rows that read
 * "UTC-10:00 … UTC+14:00" are findable by scrolling; the same rows in alphabetical order are not.
 *
 * Offsets are computed once per call: an Intl formatter per row per keystroke would make typing
 * in the search box visibly laggy.
 */
export function timezoneOptions(current: string, at: Date = new Date()): TimezoneOption[] {
  const rows = timezoneNames(current).map((zone) => ({
    zone,
    minutes: offsetMinutes(zone, at),
    caption: offsetLabel(zone, at),
  }));
  rows.sort((a, b) => a.minutes - b.minutes || a.zone.localeCompare(b.zone));
  return rows.map((row) => ({ value: row.zone, label: row.zone, caption: row.caption }));
}
