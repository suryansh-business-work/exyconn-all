import type { TrackerSettingsQuery } from '@/graphql/generated';

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
}
