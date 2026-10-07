import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebsitesPage } from '../../../../../src/pages/cms/websites';
import { renderInSite } from '../cms-helpers';
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

const renderPage = () => renderInSite(<WebsitesPage />, { route: '/website/sites' });
const click = (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('WebsitesPage forms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    answerSites([MAIN, BLOG]);
  });

  it('adds a website from a blank form, without DNS until it exists', async () => {
    renderPage();

    await click('New website');
    expect(screen.getByRole('heading', { name: 'New website' })).toBeInTheDocument();
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    expect(screen.queryByText(/DNS of/)).not.toBeInTheDocument();

    await click('Cancel form');
    expect(screen.getByRole('heading', { name: 'Websites' })).toBeInTheDocument();
  });

  it('edits a website with its domains and DNS, and reloads when done', async () => {
    renderPage();
    const blog = screen.getByText('Blog').closest('tr') as HTMLElement;

    await userEvent.click(within(blog).getByRole('button', { name: 'edit' }));
    expect(screen.getByRole('heading', { name: 'Edit website' })).toBeInTheDocument();
    expect(screen.getByText('Form for site-2')).toBeInTheDocument();
    expect(screen.getByText('DNS of site-2')).toBeInTheDocument();

    await click('Finish form');
    expect(screen.getByRole('heading', { name: 'Websites' })).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('goes back to the list from the form header', async () => {
    renderPage();

    await click('New website');
    await click('Back to Websites');
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();
  });
});
