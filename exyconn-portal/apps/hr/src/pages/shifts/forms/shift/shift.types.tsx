import type { ListShiftsPagedQuery } from '@exyconn/shell/graphql/generated';

export type ShiftRow = ListShiftsPagedQuery['listShiftsPaged']['rows'][number];

export interface ShiftFormValues {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakMinutes: number | string;
  graceMinutes: number | string;
  active: string;
}
