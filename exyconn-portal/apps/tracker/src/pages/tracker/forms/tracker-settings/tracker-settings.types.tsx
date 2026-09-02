import type { TrackerSettingsQuery } from '@exyconn/shell/graphql/generated';

export type TrackerSettingsRow = TrackerSettingsQuery['trackerSettings'];

export interface TrackerSettingsFormValues {
  intervalMinutes: number;
  screenshotsPerInterval: number;
  idleThresholdSeconds: number;
  screenshotMaxWidth: number;
  screenshotQuality: number;
  randomizeScreenshotTiming: boolean;
  blurScreenshots: boolean;
  trackWindowTitles: boolean;
  /** IANA zone name, or '' for "use each device's own timezone". */
  defaultTimezone: string;
}
