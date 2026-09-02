import type {
  TrackerCalendarQuery,
  TrackerDayQuery,
  TrackerAccessListQuery,
  TrackerDevicesQuery,
  TrackerSettingsQuery,
  MyTrackerAccessQuery,
} from '@/graphql/generated';

/** Shared, codegen-derived tracker types reused across the tracker pages. */
export type TrackerDayBucketData = TrackerCalendarQuery['trackerCalendar'][number];
export type TrackerDayData = TrackerDayQuery['trackerDay'];
export type TrackerScreenshotData = TrackerDayData['screenshots'][number];
export type TrackerAppUsageData = TrackerDayData['appUsage'][number];
export type TrackerAccessRow = TrackerAccessListQuery['trackerAccessList'][number];
export type TrackerDeviceRow = TrackerDevicesQuery['trackerDevices'][number];
export type TrackerSettingsRow = TrackerSettingsQuery['trackerSettings'];
export type MyTrackerAccessData = MyTrackerAccessQuery['myTrackerAccess'];

/** A formatter that turns an ISO date-time string into a localized label. */
export type DateTimeFormatter = (value: string) => string;
