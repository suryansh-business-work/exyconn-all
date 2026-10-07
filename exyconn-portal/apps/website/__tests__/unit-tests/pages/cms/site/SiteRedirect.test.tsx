import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { SiteRedirect } from '../../../../../src/pages/cms/site';
import { createWrapper } from '../../../test-utils';
import { UrlProbe, siteFixture } from '../cms-helpers';

const gql = vi.hoisted(() => ({ sites: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsSitesQuery: () => gql.sites(),
}));

const answer = (extra: Readonly<{ sites?: unknown[]; loading?: boolean; error?: Error }>) =>
  gql.sites.mockReturnValue({
    data: extra.sites && { cmsSites: extra.sites },
    loading: extra.loading ?? false,
    error: extra.error,
  });

/** Site pages print the URL; every other address is the redirect under test. */
function renderAt(route: string) {
  return render(
    <Routes>
      <Route path="/website/s/:siteSlug" element={<UrlProbe />} />
      <Route path="/website/s/:siteSlug/blog" element={<UrlProbe />} />
      <Route path="*" element={<SiteRedirect />} />
    </Routes>,
    { wrapper: createWrapper({ route }) },
  );
}

const url = () => screen.findByLabelText('current url');

describe('SiteRedirect', () => {
  beforeEach(() => {
    gql.sites.mockReset();
    globalThis.localStorage.clear();
    answer({ sites: [siteFixture({ slug: 'main' })] });
  });

  it('sends a site-less page address to that page of the preferred site, query kept', async () => {
    renderAt('/website/blog?tab=drafts');
    expect(await url()).toHaveTextContent('/website/s/main/blog?tab=drafts');
  });

  it('sends the bare website address to the site overview', async () => {
    renderAt('/website');
    expect(await url()).toHaveTextContent(/^\/website\/s\/main$/);
  });

  it('sends an unknown page of a site to the overview instead of prefixing it again', async () => {
    renderAt('/website/s/other/unknown');
    expect(await url()).toHaveTextContent(/^\/website\/s\/main$/);
  });

  it('sends the bare site segment to the overview', async () => {
    renderAt('/website/s');
    expect(await url()).toHaveTextContent(/^\/website\/s\/main$/);
  });

  it('waits for the sites with a spinner', () => {
    answer({ loading: true });
    renderAt('/website/blog');
    expect(screen.getByRole('progressbar', { name: 'Loading the websites' })).toBeInTheDocument();
  });

  it('says why the sites could not load', () => {
    answer({ error: new Error('offline') });
    renderAt('/website/blog');
    expect(screen.getByText('Could not load the websites: offline')).toBeInTheDocument();
  });

  it('points to Websites when there is no site yet', () => {
    answer({ sites: [] });
    renderAt('/website/blog');
    expect(
      screen.getByText('There is no website yet. Add one under Websites.'),
    ).toBeInTheDocument();
  });
});
