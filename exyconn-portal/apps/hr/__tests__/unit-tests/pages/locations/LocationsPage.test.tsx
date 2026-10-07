import { describe, expect, it, vi } from 'vitest';
import { ListLocationsPagedDocument } from '@exyconn/shell/graphql/generated';
import { LocationsPage } from '../../../../src/pages/locations';
import { LOCATION_COLUMNS } from '../../../../src/pages/locations/location-grid';
import { tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';
import { actionKeys, columnIds } from '../../harness/grid';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListLocationsStatsQuery: () => gql.stats(),
  useDeleteLocationMutation: () => [gql.remove],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/locations/forms/location', async () => ({
  LocationForm: (await import('../../harness/form-stub')).FormStub,
}));

describeCrudPage('LocationsPage', {
  page: <LocationsPage />,
  mocks: gql,
  statsKey: 'listLocationsStats',
  stats: tableStats(5, { active: { true: 4, false: 1 } }),
  // The page shows the total twice: as the first tile and again as the fourth.
  lines: ['Locations: 5', 'Active: 4', 'Inactive: 1', 'Locations: 5'],
  emptyLines: ['Locations: 0', 'Active: 0', 'Inactive: 0', 'Locations: 0'],
  document: ListLocationsPagedDocument,
  pageKey: 'listLocationsPaged',
  columns: LOCATION_COLUMNS,
  meta: {
    title: 'Locations',
    exportFileName: 'locations',
    entityLabel: 'location',
    searchPlaceholder: 'Search locations…',
  },
  row: { id: 'loc-4', name: 'Bengaluru office', code: 'BLR' },
  confirm: 'Delete this location?',
  entity: 'Location',
});

describe('LOCATION_COLUMNS', () => {
  it('lays out the locations with edit and delete at the end', () => {
    expect(columnIds(LOCATION_COLUMNS)).toEqual([
      'name',
      'code',
      'city',
      'timezone',
      'active',
      'actions',
    ]);
    expect(actionKeys(LOCATION_COLUMNS)).toEqual(['edit', 'delete']);
  });
});
