import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebsitesPage } from '../../../../../src/pages/cms/websites';
import { moduleDashboard, statTiles } from '../cms-dashboard-stub';
import { UrlProbe, renderInSite } from '../cms-helpers';
import { BLOG, MAIN } from './websites.fixtures';
import { answerSites, websitesGql as gql } from './websites.mocks';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) =>
  (await import('./websites.mocks')).generatedModule(importOriginal),
);
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../cms-settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/components/dashboard/ModuleDashboard', async () => ({
  ModuleDashboard: (await import('../cms-dashboard-stub')).ModuleDashboardStub,
}));
vi.mock('../../../../../src/pages/website/forms/cms-site', async () => ({
  CmsSiteForm: (await import('../cms-form-stub')).CmsFormStub,
}));
vi.mock('../../../../../src/pages/cms/dns', async () =>
  (await import('./websites.mocks')).dnsModule(),
);

const renderPage = () =>
  renderInSite(
    <>
      <WebsitesPage />
      <UrlProbe />
    </>,
    { route: '/website/sites' },
  );
const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;
const url = () => screen.getByLabelText('current url');

describe('WebsitesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.localStorage.clear();
    gql.refetch.mockResolvedValue({});
    gql.setDefault.mockResolvedValue({ data: {} });
    gql.deleteSite.mockResolvedValue({ data: {} });
    answerSites([MAIN, BLOG]);
  });

  it('counts the websites, the active ones and their domains', () => {
    renderPage();

    expect(statTiles()).toEqual({ Websites: '2', Active: '1', Domains: '2' });
    expect(moduleDashboard.props).toMatchObject({ title: 'Websites', statsLoading: false });
  });

  it('marks the tiles loading until the first answer', () => {
    answerSites(undefined, true);
    renderPage();

    expect(statTiles()).toEqual({ Websites: '0', Active: '0', Domains: '0' });
    expect(moduleDashboard.props?.statsLoading).toBe(true);
  });

  it('lists each site with its key, domains, status, default flag, markets and date', () => {
    renderPage();
    const main = rowOf('Exyconn');
    const blog = rowOf('Blog');

    expect(within(main).getByText('exyconn.com, www.exyconn.com')).toBeInTheDocument();
    expect(within(main).getByText('Default')).toBeInTheDocument();
    expect(within(main).getByText('Yes')).toBeInTheDocument();
    expect(within(main).getByText('ACTIVE')).toBeInTheDocument();
    expect(within(main).getByText('on 2026-01-02T00:00:00.000Z')).toBeInTheDocument();
    expect(within(blog).getByText('blog')).toBeInTheDocument();
    expect(within(blog).getByText('—')).toBeInTheDocument();
    expect(within(blog).getByText('No')).toBeInTheDocument();
    expect(within(blog).queryByText('Default')).not.toBeInTheDocument();
  });

  it("opens a site's overview from its row and its pages from Open", async () => {
    renderPage();

    await userEvent.click(screen.getByText('Exyconn'));
    expect(url()).toHaveTextContent(/^\/website\/s\/main$/);

    await userEvent.click(within(rowOf('Blog')).getByRole('button', { name: 'Open website' }));
    expect(url()).toHaveTextContent('/website/s/blog/pages');
  });

  it('makes another site the default after asking', async () => {
    renderPage();

    expect(
      within(rowOf('Exyconn')).queryByRole('button', { name: 'Make default website' }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      within(rowOf('Blog')).getByRole('button', { name: 'Make default website' }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Make Blog the default website?')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Make default' }));

    expect(await screen.findByText('Blog is now the default website')).toBeInTheDocument();
    expect(gql.setDefault).toHaveBeenCalledWith({ variables: { id: 'site-2' } });
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a site after confirming that its content stays', async () => {
    renderPage();

    await userEvent.click(within(rowOf('Blog')).getByRole('button', { name: 'delete' }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(
        'Delete the website Blog? Its pages, fragments and media stay in the database.',
      ),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Website deleted')).toBeInTheDocument();
    expect(gql.deleteSite).toHaveBeenCalledWith({ variables: { id: 'site-2' } });
    await waitFor(() => expect(gql.refetch).toHaveBeenCalled());
  });
});
