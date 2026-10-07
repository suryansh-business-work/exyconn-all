import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListGigsPagedDocument } from '@exyconn/shell/graphql/generated';
import { GigsPage } from '../../../../src/pages/website/GigsPage';
import { GIG_COLUMNS } from '../../../../src/pages/website/gigs-grid';
import { renderInSite } from '../cms/cms-helpers';
import { dashboardProps, paged, statValues } from './content-dashboard-stub';
import { confirmRowDelete, pendingQuery, runRowAction } from './content-page-helpers';

const gql = vi.hoisted(() => ({ list: vi.fn(), deleteGig: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListGigsQuery: () => gql.list(),
  useDeleteGigMutation: () => [gql.deleteGig],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('./content-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDate: (value: string) => `on ${value}` }),
}));

vi.mock('../../../../src/pages/website/forms/gig', async () => ({
  GigForm: (await import('./content-form-stub')).ContentFormStub,
}));

const gig = (overrides: Record<string, unknown> = {}) => ({
  id: 'gig-1',
  siteId: 'site-1',
  title: 'Landing page',
  category: 'Design',
  status: 'open',
  isUrgent: false,
  ...overrides,
});

describe('GigsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.deleteGig.mockResolvedValue({ data: { deleteGig: true } });
    gql.list.mockReturnValue({
      data: {
        listGigs: [
          gig({ id: 'a', isUrgent: true }),
          gig({ id: 'b', status: 'completed', category: 'Writing' }),
          gig({ id: 'c', siteId: '', category: 'Design', isUrgent: true }),
          gig({ id: 'd', siteId: 'site-2', category: 'Video' }),
        ],
      },
      loading: false,
    });
  });

  it('counts the site’s gigs, the open and urgent ones and their categories', () => {
    renderInSite(<GigsPage />);

    expect(statValues()).toEqual({ Gigs: '3', Open: '2', Urgent: '2', Categories: '2' });
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the gigs arrive', () => {
    gql.list.mockReturnValue(pendingQuery());
    renderInSite(<GigsPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues().Gigs).toBe('0');
  });

  it('drives the server grid with the paged gigs query, scoped to the site', () => {
    renderInSite(<GigsPage />);
    const page = { totalCount: 1, rows: [gig()] };

    expect(paged.document).toBe(ListGigsPagedDocument);
    expect(paged.select?.({ listGigsPaged: page } as never)).toBe(page);
    expect(paged.extraFilters).toEqual([{ field: 'siteId', op: 'EQUALS', value: 'site-1' }]);
    expect(dashboardProps().columnDefs).toBe(GIG_COLUMNS);
    expect(dashboardProps()).toMatchObject({ title: 'Gigs', exportFileName: 'gigs' });
    expect(dashboardProps().context.formatDate?.('2026-04-01')).toBe('on 2026-04-01');
  });

  it('opens the form for a new and an existing gig', async () => {
    renderInSite(<GigsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', gig({ title: 'Edited gig' }));
    expect(screen.getByText(/"title":"Edited gig"/)).toBeInTheDocument();
  });

  it('deletes a gig after confirming, by its id', async () => {
    renderInSite(<GigsPage />);

    await confirmRowDelete(gig({ id: 'gig-4' }), 'Delete gig Landing page?');

    expect(gql.deleteGig).toHaveBeenCalledWith({ variables: { id: 'gig-4' } });
    expect(await screen.findByText('Gig deleted')).toBeInTheDocument();
  });
});
