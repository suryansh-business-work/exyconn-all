import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { DemoFooter } from '../../../src/page/DemoFooter';
import { ALL_DEMOS_URL, DEMO_LINKS } from '../../../src/page/demoLinks';
import { renderWithProviders } from '../test-utils';
import { answerBranding, brand, brandingQuery } from './branding';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublicBrandingQuery: () => brandingQuery(),
}));

const footerNav = () => screen.getByRole('navigation', { name: 'Footer' });

describe('DemoFooter', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2031, 5, 1));
    answerBranding(brand());
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("credits this year's legal name and links every demo, the website and the inbox", () => {
    renderWithProviders(<DemoFooter />);
    expect(
      screen.getByText('© 2031 Acme Private Limited. Demos run on sample data.'),
    ).toBeInTheDocument();
    const nav = footerNav();
    expect(within(nav).getByRole('link', { name: 'All demos' })).toHaveAttribute(
      'href',
      ALL_DEMOS_URL,
    );
    for (const demo of DEMO_LINKS) {
      expect(within(nav).getByRole('link', { name: demo.label })).toHaveAttribute('href', demo.url);
    }
    expect(within(nav).getByRole('link', { name: 'Website' })).toHaveAttribute(
      'href',
      'https://acme.example.test',
    );
    expect(within(nav).getByRole('link', { name: 'hello@acme.example.test' })).toHaveAttribute(
      'href',
      'mailto:hello@acme.example.test',
    );
  });

  it('leaves out the website and inbox links the company has not set', () => {
    answerBranding(brand({ websiteUrl: null, supportEmail: null }));
    renderWithProviders(<DemoFooter />);
    const nav = footerNav();
    expect(within(nav).getAllByRole('link')).toHaveLength(DEMO_LINKS.length + 1);
    expect(within(nav).queryByRole('link', { name: 'Website' })).not.toBeInTheDocument();
  });
});
