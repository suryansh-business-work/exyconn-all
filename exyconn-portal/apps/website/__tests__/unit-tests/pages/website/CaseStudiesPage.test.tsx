import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListCaseStudiesPagedDocument } from '@exyconn/shell/graphql/generated';
import { CaseStudiesPage } from '../../../../src/pages/website/CaseStudiesPage';
import { CASE_STUDY_COLUMNS } from '../../../../src/pages/website/case-studies-grid';
import { renderInSite, siteFixture, UrlProbe } from '../cms/cms-helpers';
import { dashboardProps, paged, statValues } from './content-dashboard-stub';
import { confirmRowDelete, pendingQuery, runRowAction } from './content-page-helpers';
import { caseStudyRow } from './content-fixtures';

const gql = vi.hoisted(() => ({ list: vi.fn(), deleteCase: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListCaseStudiesQuery: () => gql.list(),
  useDeleteCaseStudyMutation: () => [gql.deleteCase],
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

vi.mock('../../../../src/pages/website/forms/case-study', async () => ({
  CaseStudyForm: (await import('./content-form-stub')).ContentFormStub,
}));

const renderPage = (site = siteFixture()) =>
  renderInSite(
    <>
      <CaseStudiesPage />
      <UrlProbe />
    </>,
    { route: `/website/s/${site.slug}/case-studies`, site },
  );

describe('CaseStudiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.deleteCase.mockResolvedValue({ data: { deleteCaseStudy: true } });
    gql.list.mockReturnValue({
      data: {
        listCaseStudies: [
          caseStudyRow({ id: 'a', category: 'Cloud' }),
          caseStudyRow({ id: 'b', category: '', featured: false, isActive: false }),
          caseStudyRow({ id: 'c', siteId: '', category: 'AI' }),
          caseStudyRow({ id: 'd', siteId: 'site-2', category: 'Data' }),
        ],
      },
      loading: false,
    });
  });

  it('counts the site’s case studies and their named categories', () => {
    renderPage();

    expect(statValues()).toEqual({
      'Case studies': '3',
      Featured: '2',
      Active: '2',
      Categories: '2',
    });
  });

  it('leaves unfiled case studies to the default site', () => {
    renderPage(siteFixture({ id: 'site-2', slug: 'second', isDefault: false }));

    expect(statValues()['Case studies']).toBe('1');
    expect(paged.extraFilters).toEqual([{ field: 'siteId', op: 'EQUALS', value: 'site-2' }]);
  });

  it('marks the tiles loading until the case studies arrive', () => {
    gql.list.mockReturnValue(pendingQuery());
    renderPage();

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues()['Case studies']).toBe('0');
  });

  it('drives the server grid with the paged case studies query', () => {
    renderPage();
    const page = { totalCount: 1, rows: [caseStudyRow()] };

    expect(paged.document).toBe(ListCaseStudiesPagedDocument);
    expect(paged.select?.({ listCaseStudiesPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(CASE_STUDY_COLUMNS);
    expect(dashboardProps()).toMatchObject({
      title: 'Case studies',
      exportFileName: 'case-studies',
    });
    expect(dashboardProps().context.formatDate?.('2026-02-01')).toBe('on 2026-02-01');
  });

  it('opens the form for a new and an existing case study', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();

    await runRowAction('edit', caseStudyRow({ title: 'Edited study' }));
    expect(screen.getByText(/"title":"Edited study"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.queryByText(/Edited study/)).not.toBeInTheDocument();
  });

  it('opens a case study in the live editor of the current site', async () => {
    renderPage();

    await runRowAction('liveEdit', caseStudyRow({ id: 'case-9' }));

    expect(screen.getByLabelText('current url')).toHaveTextContent(
      '/website/s/main/case-studies/case-9/live-edit',
    );
  });

  it('deletes a case study after confirming, by its id', async () => {
    renderPage();

    await confirmRowDelete(caseStudyRow({ id: 'case-4' }), 'Delete case study Acme migration?');

    expect(gql.deleteCase).toHaveBeenCalledWith({ variables: { id: 'case-4' } });
    expect(await screen.findByText('Case study deleted')).toBeInTheDocument();
  });
});
