import { isValidElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { TabberProps } from '@exyconn/tabber';
import { SocialPage } from '../../../../src/pages/social';
import { AccountsTab } from '../../../../src/pages/social/AccountsTab';
import { PostsTab } from '../../../../src/pages/social/PostsTab';
import { ComposeTab } from '../../../../src/pages/social/ComposeTab';
import { CalendarTab } from '../../../../src/pages/social/CalendarTab';
import { AnalyticsTab } from '../../../../src/pages/social/AnalyticsTab';
import { renderWithProviders } from '../../test-utils';

const recorded = vi.hoisted(() => ({ tabber: null as unknown }));

vi.mock('@exyconn/tabber', () => ({
  Tabber: (props: Readonly<TabberProps>) => {
    recorded.tabber = props;
    return <nav aria-label={props.ariaLabel} />;
  },
}));
vi.mock('../../../../src/pages/social/AccountsTab', () => ({ AccountsTab: () => null }));
vi.mock('../../../../src/pages/social/PostsTab', () => ({ PostsTab: () => null }));
vi.mock('../../../../src/pages/social/ComposeTab', () => ({ ComposeTab: () => null }));
vi.mock('../../../../src/pages/social/CalendarTab', () => ({ CalendarTab: () => null }));
vi.mock('../../../../src/pages/social/AnalyticsTab', () => ({ AnalyticsTab: () => null }));

const tabber = () => recorded.tabber as TabberProps;
const typeOf = (content: ReactNode) => (isValidElement(content) ? content.type : null);

describe('SocialPage', () => {
  it('heads the page and keeps its tabs under the social path', () => {
    renderWithProviders(<SocialPage />);

    expect(screen.getByRole('heading', { name: 'Social media' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Social media' })).toBeInTheDocument();
    expect(tabber().basePath).toBe('/marketing/social');
  });

  it('puts accounts first, where a provider sends people back after connecting', () => {
    renderWithProviders(<SocialPage />);

    expect(tabber().items.map((item) => [item.slug, item.label, typeOf(item.content)])).toEqual([
      ['accounts', 'Accounts', AccountsTab],
      ['posts', 'Posts', PostsTab],
      ['compose', 'Compose', ComposeTab],
      ['calendar', 'Calendar', CalendarTab],
      ['analytics', 'Analytics', AnalyticsTab],
    ]);
    expect(tabber().items.every((item) => isValidElement(item.icon))).toBe(true);
  });
});
