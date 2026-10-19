import type { EmployeeLocationsQuery } from '@/graphql/generated';
import { TrackerLocationKind, TrackerLocationSource } from '@/graphql/generated';

/** One pin of the day, as `employeeLocations` returns it. */
export type LocationPin = EmployeeLocationsQuery['employeeLocations'][number];

/** Why a pin was taken, in words (the English source; translated where shown). */
export const KIND_LABEL: Readonly<Record<TrackerLocationKind, string>> = {
  [TrackerLocationKind.Attendance]: 'Attendance',
  [TrackerLocationKind.Move]: 'Moved',
};

/** Where the fix came from, in words. */
export const SOURCE_LABEL: Readonly<Record<TrackerLocationSource, string>> = {
  [TrackerLocationSource.Gps]: 'Phone GPS',
  [TrackerLocationSource.System]: 'Computer location',
};
