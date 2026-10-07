import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteSettingsPage } from '../../../../../src/pages/cms/settings';
import { UrlProbe, renderInSite, siteFixture } from '../cms-helpers';

vi.mock('../../../../../src/pages/website/forms/cms-site', () => ({
  CmsSiteForm: (
    props: Readonly<{
      initial: { name: string; slug: string } | null;
      onCancel: () => void;
      onDone: () => void;
      onSaved?: (site: { slug: string }) => void;
    }>,
  ) => (
    <div>
      <p>{`Site form for ${props.initial?.name ?? 'a new site'}`}</p>
      <button type="button" onClick={props.onCancel}>
        Cancel form
      </button>
      <button type="button" onClick={props.onDone}>
        Finish form
      </button>
      <button type="button" onClick={() => props.onSaved?.({ slug: 'main' })}>
        Save same key
      </button>
      <button type="button" onClick={() => props.onSaved?.({ slug: 'brand' })}>
        Save new key
      </button>
    </div>
  ),
}));
vi.mock('../../../../../src/pages/cms/dns', () => ({
  DomainsDnsPanel: (props: Readonly<{ siteId: string }>) => <p>{`DNS of ${props.siteId}`}</p>,
}));

function renderPage(refetchSites = vi.fn().mockResolvedValue(undefined)) {
  renderInSite(
    <>
      <SiteSettingsPage />
      <UrlProbe />
    </>,
    { site: siteFixture(), refetchSites, route: '/website/s/main/settings' },
  );
  return refetchSites;
}

const click = (name: string) => userEvent.click(screen.getByRole('button', { name }));
const url = () => screen.getByLabelText('current url');

describe('SiteSettingsPage', () => {
  it("edits the current site's settings above its domains and DNS", () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('How Exyconn is served')).toBeInTheDocument();
    expect(screen.getByText('Site form for Exyconn')).toBeInTheDocument();
    expect(screen.getByText('DNS of site-1')).toBeInTheDocument();
  });

  it('goes back to the site overview on cancel', async () => {
    renderPage();
    await click('Cancel form');
    expect(url()).toHaveTextContent(/^\/website\/s\/main$/);
  });

  it('reloads the sites once saved', async () => {
    const refetchSites = renderPage();
    await click('Finish form');
    expect(refetchSites).toHaveBeenCalledTimes(1);
  });

  it('reports a reload that failed', async () => {
    renderPage(vi.fn().mockRejectedValue('offline'));
    await click('Finish form');
    expect(await screen.findByText('Reload failed')).toBeInTheDocument();
  });

  it('stays put when the key is unchanged and follows a new key', async () => {
    renderPage();

    await click('Save same key');
    expect(url()).toHaveTextContent('/website/s/main/settings');

    await click('Save new key');
    expect(url()).toHaveTextContent('/website/s/brand/settings');
  });
});
