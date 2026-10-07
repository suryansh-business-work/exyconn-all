import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AnnouncementCategory,
  ListItAnnouncementsPagedDocument,
} from '@exyconn/shell/graphql/generated';
import { AnnouncementForm } from '@exyconn/shell/pages/content-forms';
import { AnnouncementsPage } from '../../../../src/pages/announcements';
import {
  crud,
  dashboardProps,
  fetchRows,
  fetcherCall,
  resetPage,
  resourceOptions,
  statPairs,
  statsOf,
} from '../../core/crud-page.mocks';
import { formatDate } from '../../core/settings.mock';
import { formatCell, headersOf } from '../../core/grid.helpers';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/crud', async () => (await import('../../core/crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../core/settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListAnnouncementsStatsQuery: gql.stats,
  useDeleteAnnouncementMutation: () => [gql.remove],
}));

const answer = (data: object | undefined, loading: boolean) =>
  gql.stats.mockReturnValue({ data, loading, refetch: gql.refetch });

const row = { id: 'ann-1', title: 'Firewall maintenance' };

describe('AnnouncementsPage', () => {
  beforeEach(() => {
    resetPage();
    gql.remove.mockReset();
    answer(undefined, true);
  });

  it('frames what IT tells staff, with its grid, export name and dates', () => {
    renderWithProviders(<AnnouncementsPage />);
    const props = dashboardProps();
    expect(props).toMatchObject({
      title: 'Announcements',
      entityLabel: 'announcement',
      exportFileName: 'it-announcements',
      permissionModule: 'Announcement',
      fetchRows,
      crud,
      searchPlaceholder: 'Search announcements…',
    });
    expect(props.context).toEqual({
      actions: { edit: crud.openEdit, delete: crud.remove },
      formatDate,
    });
    expect(headersOf(props.columnDefs)).toEqual([
      'Title',
      'Kind',
      'Audience',
      'Pinned',
      'Published',
      'Expires',
      '',
    ]);
    expect(formatCell(props.columnDefs, 'expiresAt', row, '')).toBe('—');
    expect(formatCell(props.columnDefs, 'publishedAt', row, '2026-10-01')).toBe('on 2026-10-01');
  });

  it('reads IT announcements from the paged query', () => {
    renderWithProviders(<AnnouncementsPage />);
    const paged = { rows: [row], totalCount: 1 };
    expect(fetcherCall().document).toBe(ListItAnnouncementsPagedDocument);
    expect(fetcherCall().select({ listItAnnouncementsPaged: paged })).toBe(paged);
  });

  it('only lets IT announce maintenance, outages and security alerts', () => {
    renderWithProviders(<AnnouncementsPage />);
    const form = dashboardProps().renderForm?.(null);
    expect(form?.type).toBe(AnnouncementForm);
    expect(form?.props).toEqual({
      initial: null,
      categories: [
        AnnouncementCategory.Maintenance,
        AnnouncementCategory.Outage,
        AnnouncementCategory.SecurityAlert,
      ],
      onCancel: crud.close,
      onDone: crud.onDone,
    });
  });

  it('counts each kind of announcement once the stats answer', () => {
    const { rerender } = renderWithProviders(<AnnouncementsPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(statPairs()).toEqual([
      ['Maintenance windows', '0'],
      ['Outages', '0'],
      ['Security alerts', '0'],
    ]);

    answer(
      { listAnnouncementsStats: statsOf(8, { category: { MAINTENANCE: 3, OUTAGE: 1 } }) },
      false,
    );
    rerender(<AnnouncementsPage />);
    expect(dashboardProps().statsLoading).toBe(false);
    expect(statPairs().map(([, value]) => value)).toEqual(['3', '1', '0']);
  });

  it('deletes by id after confirming by title, then reloads its stats', async () => {
    gql.remove.mockResolvedValue({ data: {} });
    renderWithProviders(<AnnouncementsPage />);
    const options = resourceOptions();
    expect(options.label).toBe('Announcement');
    expect(options.refetch).toBe(gql.refetch);
    expect(options.confirmMessage(row)).toEqual({
      message: 'Delete "{title}"?',
      values: { title: 'Firewall maintenance' },
    });
    await options.onDelete(row);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'ann-1' } });
  });
});
