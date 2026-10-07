import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { SiteLayout, useCurrentSite } from '../../../../../src/pages/cms/site';
import { readLastSite } from '../../../../../src/pages/cms/site/site-paths';
import { createWrapper } from '../../../test-utils';
import { siteFixture } from '../cms-helpers';

const gql = vi.hoisted(() => ({ sites: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsSitesQuery: () => gql.sites(),
}));

const main = siteFixture({ domains: ['exyconn.com', 'www.exyconn.com'] });
const blog = siteFixture({ id: 'site-2', slug: 'blog', name: 'Blog', isDefault: false });

function SitePage() {
  const { site, sites } = useCurrentSite();
  return <p>{`Working on ${site.name} of ${sites.length}`}</p>;
}

function renderLayout(route: string) {
  return render(
    <Routes>
      <Route path="/website/s/:siteSlug" element={<SiteLayout />}>
        <Route index element={<SitePage />} />
      </Route>
      <Route path="/website/sites" element={<p>Websites list</p>} />
    </Routes>,
    { wrapper: createWrapper({ route }) },
  );
}

const answer = (extra: Readonly<{ sites?: unknown[]; loading?: boolean; error?: Error }>) =>
  gql.sites.mockReturnValue({
    data: extra.sites && { cmsSites: extra.sites },
    loading: extra.loading ?? false,
    error: extra.error,
    refetch: gql.refetch,
  });

describe('SiteLayout', () => {
  beforeEach(() => {
    gql.sites.mockReset();
    globalThis.localStorage.clear();
  });

  it('renders the page under the site from the URL, with its domains and the switcher', async () => {
    answer({ sites: [main, blog] });
    renderLayout('/website/s/main');

    expect(await screen.findByText('Working on Exyconn of 2')).toBeInTheDocument();
    expect(screen.getByText('exyconn.com, www.exyconn.com')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveTextContent('Exyconn (default)');
    expect(readLastSite()).toBe('main');
  });

  it('shows a spinner while the sites load', () => {
    answer({ loading: true });
    renderLayout('/website/s/main');

    expect(screen.getByRole('progressbar', { name: 'Loading the website' })).toBeInTheDocument();
    expect(readLastSite()).toBeNull();
  });

  it('says why the sites could not load and links back to the list', async () => {
    answer({ error: new Error('offline') });
    renderLayout('/website/s/main');

    expect(screen.getByText('Could not load the websites: offline')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Websites' }));
    expect(await screen.findByText('Websites list')).toBeInTheDocument();
  });

  it('warns about a site that does not exist', () => {
    answer({ sites: [main] });
    renderLayout('/website/s/ghost');

    expect(screen.getByText('There is no website "ghost".')).toBeInTheDocument();
    expect(screen.queryByText(/Working on/)).not.toBeInTheDocument();
  });
});
