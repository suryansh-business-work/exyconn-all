import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PagesPage } from '../../../../../src/pages/cms/pages';
import { PAGES_COLUMNS } from '../../../../../src/pages/cms/pages/pages-grid';
import { crudDashboard, crudProps } from '../cms-dashboard-stub';
import { confirmRowDelete, runRowAction } from '../cms-crud-helpers';
import { UrlProbe, formatDate, renderInSite } from '../cms-helpers';
import { pageRow } from './pages.fixtures';
import { pagesPage } from './pages-page.stubs';

const gql = vi.hoisted(() => ({ deletePage: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDeleteCmsPageMutation: () => [gql.deletePage],
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../cms-settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/crud', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/crud')>()),
  CrudDashboard: (await import('../cms-dashboard-stub')).CrudDashboardStub,
}));
vi.mock('../../../../../src/pages/website/forms/cms-page-duplicate', async () => ({
  DuplicatePageForm: (await import('./pages-page.stubs')).DuplicateFormStub,
}));
vi.mock('../../../../../src/pages/cms/pages/PageSettingsEditor', async () => ({
  PageSettingsEditor: (await import('./pages-page.stubs')).SettingsEditorStub,
}));
vi.mock('../../../../../src/pages/cms/pages/PageRevisionsDrawer', async () => ({
  PageRevisionsDrawer: (await import('./pages-page.stubs')).RevisionsDrawerStub,
}));
vi.mock('../../../../../src/pages/cms/pages/useCmsPagesFetcher', async () => ({
  useCmsPagesFetcher: (await import('./pages-page.stubs')).useCmsPagesFetcherStub,
}));
vi.mock('../../../../../src/pages/cms/pages/usePagePublishing', async () => {
  const { pagesPage: doubles } = await import('./pages-page.stubs');
  return { usePagePublishing: () => ({ publish: doubles.publish, unpublish: doubles.unpublish }) };
});
vi.mock('../../../../../src/pages/cms/pages/usePreviewPage', async () => {
  const { pagesPage: doubles } = await import('./pages-page.stubs');
  return { usePreviewPage: () => doubles.preview, usePreviewUrl: () => doubles.preview };
});

const renderPage = () =>
  renderInSite(
    <>
      <PagesPage />
      <UrlProbe />
    </>,
    { route: '/website/s/main/pages' },
  );
const url = () => screen.getByLabelText('current url');
const row = pageRow();

describe('PagesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crudDashboard.props = null;
    gql.deletePage.mockResolvedValue({ data: {} });
  });

  it("drives the grid with the site's pages, unfiltered at first", () => {
    renderPage();

    expect(crudProps()).toMatchObject({
      title: 'Pages',
      subtitleValues: { site: 'Exyconn' },
      entityLabel: 'page',
      columnDefs: PAGES_COLUMNS,
      fetchRows: pagesPage.fetchRows,
    });
    expect(crudProps().context.formatDate).toBe(formatDate);
    expect(pagesPage.fetcherArgs).toEqual({ siteId: 'site-1', filters: { status: '', kind: '' } });
  });

  it('refetches with the filters picked in the toolbar', async () => {
    renderPage();

    await userEvent.click(screen.getAllByRole('combobox')[0]);
    await userEvent.click(screen.getByRole('option', { name: 'Draft' }));

    expect(pagesPage.fetcherArgs?.filters).toEqual({ status: 'DRAFT', kind: '' });
  });

  it('opens a page in the builder from its row or the builder action', async () => {
    renderPage();

    await runRowAction('build', row);
    expect(url()).toHaveTextContent('/website/s/main/pages/page-1/edit');

    await runRowAction('build', pageRow({ id: 'page-2' }));
    expect(url()).toHaveTextContent('/website/s/main/pages/page-2/edit');
    act(() => crudProps().onRowClick?.(pageRow({ id: 'page-3' }) as never));
    expect(await screen.findByText('/website/s/main/pages/page-3/edit')).toBeInTheDocument();
  });

  it('previews, publishes and unpublishes through the page hooks', async () => {
    renderPage();

    await runRowAction('preview', row);
    await runRowAction('publish', row);
    await runRowAction('unpublish', row);

    expect(pagesPage.preview).toHaveBeenCalledWith('page-1');
    expect(pagesPage.publish).toHaveBeenCalledWith(row);
    expect(pagesPage.unpublish).toHaveBeenCalledWith(row);
  });

  it('creates a page from blank settings and opens it in the builder', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Settings of a new page on site-1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Create page' }));

    expect(url()).toHaveTextContent('/website/s/main/pages/page-new/edit');
  });

  it("edits a page's settings and closes them when done", async () => {
    renderPage();

    await runRowAction('settings', row);
    expect(screen.getByText('Settings of page-1 on site-1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(screen.queryByText(/Settings of/)).not.toBeInTheDocument();
  });

  it('duplicates a page in a dialog', async () => {
    renderPage();

    await runRowAction('duplicate', row);
    expect(screen.getByText('Duplicate /about-us')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close duplicate' }));
    expect(screen.queryByText('Duplicate /about-us')).not.toBeInTheDocument();

    await runRowAction('duplicate', row);
    await userEvent.click(screen.getByRole('button', { name: 'Finish duplicate' }));
    expect(screen.queryByText('Duplicate /about-us')).not.toBeInTheDocument();
  });

  it("lists a page's revisions in a drawer", async () => {
    renderPage();

    await runRowAction('revisions', row);
    expect(screen.getByText('Revisions of page-1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Restore revision' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close revisions' }));
    expect(screen.queryByText('Revisions of page-1')).not.toBeInTheDocument();
  });

  it('deletes a page and its revisions after confirming', async () => {
    renderPage();

    await confirmRowDelete(row, 'Delete the page /about-us? Its revisions go with it.');

    expect(gql.deletePage).toHaveBeenCalledWith({ variables: { id: 'page-1' } });
    expect(await screen.findByText('Page deleted')).toBeInTheDocument();
  });
});
