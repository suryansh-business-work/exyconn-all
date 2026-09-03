import type { ListHolidaysPagedQuery, HolidayType } from '@exyconn/shell/graphql/generated';

export type HolidayRow = ListHolidaysPagedQuery['listHolidaysPaged']['rows'][number];

export interface HolidayFormValues {
  name: string;
  date: string;
  type: HolidayType;
  description: string;
}
