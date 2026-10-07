import { describe, expect, it } from 'vitest';
import { HOLIDAY_COLUMNS, type PagedHolidayRow } from '../../../../src/pages/holidays/holiday-grid';
import { actionKeys, columnIds, formatCell } from '../../harness/grid';

const holiday = (patch: Partial<PagedHolidayRow>) =>
  ({
    id: 'holiday-1',
    name: 'Diwali',
    country: '',
    excludedCountries: [],
    regions: [],
    cities: [],
    ...patch,
  }) as PagedHolidayRow;

describe('HOLIDAY_COLUMNS', () => {
  it('lays out the holidays register with edit and delete at the end', () => {
    expect(columnIds(HOLIDAY_COLUMNS)).toEqual([
      'name',
      'date',
      'type',
      'country',
      'excludedCountries',
      'regions',
      'cities',
      'description',
      'actions',
    ]);
    expect(actionKeys(HOLIDAY_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('names the country, or says a company-wide holiday covers all of them', () => {
    expect(formatCell(HOLIDAY_COLUMNS, 'country', holiday({ country: 'IN' }))).toBe('India');
    expect(formatCell(HOLIDAY_COLUMNS, 'country', holiday({}))).toBe('All countries');
  });

  it('names the countries that opt out of a company-wide holiday', () => {
    const row = holiday({ excludedCountries: ['US', 'GB'] });

    expect(formatCell(HOLIDAY_COLUMNS, 'excludedCountries', row)).toBe(
      'United States, United Kingdom',
    );
  });

  it('lists the regions and cities a country holiday is narrowed to', () => {
    const row = holiday({ country: 'IN', regions: ['Maharashtra', 'Goa'], cities: ['Pune'] });

    expect(formatCell(HOLIDAY_COLUMNS, 'regions', row)).toBe('Maharashtra, Goa');
    expect(formatCell(HOLIDAY_COLUMNS, 'cities', row)).toBe('Pune');
    expect(formatCell(HOLIDAY_COLUMNS, 'regions', holiday({}))).toBe('');
  });
});
