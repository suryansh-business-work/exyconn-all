import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemoHeader } from '../../../src/page/DemoHeader';
import { ALL_DEMOS_URL, DEMO_LINKS } from '../../../src/page/demoLinks';
import { renderWithProviders } from '../test-utils';
import { answerBranding, brand, brandingQuery } from './branding';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublicBrandingQuery: () => brandingQuery(),
}));

describe('DemoHeader', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    answerBranding(brand());
  });

  it('links home to all demos under the company name and marks the current demo', () => {
    renderWithProviders(<DemoHeader current="whatsapp-demo" />);
    expect(screen.getByRole('link', { name: 'Live demos by Acme' })).toHaveAttribute(
      'href',
      ALL_DEMOS_URL,
    );
    const nav = screen.getByRole('navigation', { name: 'Demos' });
    for (const demo of DEMO_LINKS) {
      const link = within(nav).getByRole('link', { name: demo.label });
      expect(link).toHaveAttribute('href', demo.url);
      if (demo.key === 'whatsapp-demo') {
        expect(link).toHaveAttribute('aria-current', 'page');
      } else {
        expect(link).not.toHaveAttribute('aria-current');
      }
    }
  });

  it('marks no demo as current on a page outside the demos', () => {
    renderWithProviders(<DemoHeader />);
    const nav = screen.getByRole('navigation', { name: 'Demos' });
    expect(within(nav).getAllByRole('link')).toHaveLength(DEMO_LINKS.length);
    expect(nav.querySelector('[aria-current]')).toBeNull();
  });

  it('sends "Talk to us" to the contact page of the company website', () => {
    renderWithProviders(<DemoHeader />);
    const talk = screen.getByRole('link', { name: 'Talk to us' });
    expect(talk).toHaveAttribute('href', 'https://acme.example.test/contact');
    expect(talk).toHaveAttribute('target', '_blank');
  });

  it('hides "Talk to us" while the company has no website', () => {
    answerBranding(brand({ websiteUrl: '' }));
    renderWithProviders(<DemoHeader />);
    expect(screen.queryByRole('link', { name: 'Talk to us' })).not.toBeInTheDocument();
  });

  it('switches between light and dark mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DemoHeader />);
    const logo = () => screen.getByRole('link', { name: 'Live demos by Acme' }).querySelector('img');
    expect(logo()).toHaveAttribute('src', 'https://cdn.example.test/acme.svg');
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
    expect(logo()).toHaveAttribute('src', 'https://cdn.example.test/acme-dark.svg');
    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
  });
});
