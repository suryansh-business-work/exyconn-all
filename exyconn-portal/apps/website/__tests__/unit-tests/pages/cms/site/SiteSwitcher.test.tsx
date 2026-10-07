import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteSwitcher } from '../../../../../src/pages/cms/site/SiteSwitcher';
import { UrlProbe, renderInSite, siteFixture } from '../cms-helpers';

const main = siteFixture();
const blog = siteFixture({ id: 'site-2', slug: 'blog', name: 'Blog', isDefault: false });

describe('SiteSwitcher', () => {
  it('lists every site, marking the default one', async () => {
    renderInSite(<SiteSwitcher />, { site: main, sites: [main, blog] });

    await userEvent.click(screen.getByRole('combobox'));

    expect(screen.getByRole('option', { name: 'Exyconn (default)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Blog' })).toBeInTheDocument();
  });

  it('opens the same section on the chosen site, leaving a record of the old one', async () => {
    renderInSite(
      <>
        <SiteSwitcher />
        <UrlProbe />
      </>,
      {
        site: main,
        sites: [main, blog],
        route: '/website/s/main/pages/64b7f0c2e4b0a1a2b3c4d5e6/edit',
      },
    );

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Blog' }));

    expect(screen.getByLabelText('current url')).toHaveTextContent('/website/s/blog/pages');
  });
});
