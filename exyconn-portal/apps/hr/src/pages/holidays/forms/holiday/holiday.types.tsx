import type { ListHolidaysPagedQuery, HolidayType } from '@exyconn/shell/graphql/generated';

export type HolidayRow = ListHolidaysPagedQuery['listHolidaysPaged']['rows'][number];

export interface HolidayFormValues {
  name: string;
  date: string;
  type: HolidayType;
  description: string;
  /** ISO 3166-1 alpha-2; '' for a holiday the whole company observes. */
  country: string;
  /** Countries that do not observe a company-wide holiday. */
  excludedCountries: string[];
  /** States or regions of a country holiday that observe it. */
  regions: string[];
  /** Cities of a country holiday that observe it; with no regions either, the whole country. */
  cities: string[];
}
