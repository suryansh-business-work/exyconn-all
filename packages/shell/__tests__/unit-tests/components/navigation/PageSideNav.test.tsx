import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@exyconn/i18n';
import {
  PageSideNav,
  filterNavItems,
  groupNavItems,
  sortNavItems,
  type PageSideNavItem,
} from '@/components/navigation/PageSideNav';

const ITEMS: PageSideNavItem[] = [
  { slug: 'slack', label: 'Slack', category: 'Messaging', icon: <span data-testid="slack-icon" /> },
  { slug: 'smtp', label: 'SMTP', category: 'Messaging' },
  { slug: 'stripe', label: 'Stripe', category: 'Payments' },
  { slug: 'resume', label: 'Résumé parser', category: 'AI' },
  { slug: 'openai', label: 'OpenAI', category: 'AI' },
];

const identity = (text: string) => text;

function renderNav(selected = 'slack', messages: Record<string, string> = {}) {
  const onSelect = vi.fn();
  render(
    <I18nProvider locale="en" messages={messages}>
      <PageSideNav items={ITEMS} selected={selected} onSelect={onSelect} ariaLabel="Integrations">
        <p>Panel body</p>
      </PageSideNav>
    </I18nProvider>,
  );
  const nav = screen.getByRole('navigation', { name: 'Integrations' });
  return { onSelect, nav };
}

const isFoldToggle = (button: HTMLElement) => button.textContent?.includes(' all') ?? false;

const headers = (nav: HTMLElement) =>
  within(nav)
    .queryAllByRole('button')
    .filter((button) => button.hasAttribute('aria-expanded') && !isFoldToggle(button));

const entryNames = (nav: HTMLElement) =>
  within(nav)
    .queryAllByRole('button')
    .filter((button) => !button.hasAttribute('aria-expanded'))
    .map((button) => button.textContent);

function stubPhone() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('page side nav model', () => {
  it('keeps everything for an empty search and matches label or category, ignoring accents', () => {
    expect(filterNavItems(ITEMS, '  ', identity)).toHaveLength(5);
    expect(filterNavItems(ITEMS, 'resume', identity).map((item) => item.slug)).toEqual(['resume']);
    expect(filterNavItems(ITEMS, 'payments', identity).map((item) => item.slug)).toEqual([
      'stripe',
    ]);
    expect(filterNavItems(ITEMS, 'zzz', identity)).toEqual([]);
  });

  it('groups by category in first-seen order and sorts a copy either way', () => {
    expect(groupNavItems(ITEMS).map((group) => [group.category, group.items.length])).toEqual([
      ['Messaging', 2],
      ['Payments', 1],
      ['AI', 2],
    ]);
    const asc = sortNavItems(ITEMS, 'asc', identity).map((item) => item.slug);
    expect(asc).toEqual(['openai', 'resume', 'slack', 'smtp', 'stripe']);
    expect(sortNavItems(ITEMS, 'desc', identity).map((item) => item.slug)).toEqual(
      [...asc].reverse(),
    );
    expect(ITEMS[0].slug).toBe('slack');
  });
});

describe('PageSideNav on a desktop', () => {
  it('lists translated entries under open category headers and marks the open one', () => {
    const { nav } = renderNav('slack', { Slack: 'Slack (es)', Messaging: 'Mensajes' });

    expect(headers(nav).map((header) => header.textContent)).toEqual([
      'Mensajes',
      'Payments',
      'AI',
    ]);
    expect(headers(nav).every((header) => header.getAttribute('aria-expanded') === 'true')).toBe(
      true,
    );
    expect(within(nav).getByRole('button', { name: 'Slack (es)' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('button', { name: 'SMTP' })).not.toHaveAttribute('aria-current');
    expect(within(nav).getByTestId('slack-icon')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Slack (es)' })).toHaveTextContent('Panel body');
  });

  it('reports the entry chosen so the page can put it in the URL', async () => {
    const { nav, onSelect } = renderNav();
    await userEvent.click(within(nav).getByRole('button', { name: 'Stripe' }));
    expect(onSelect).toHaveBeenCalledWith('stripe');
  });

  it('folds one category, then every category with one toggle, and opens them all again', async () => {
    const { nav } = renderNav();
    const messaging = within(nav).getByRole('button', { name: 'Messaging' });
    const toggle = () => within(nav).getByRole('button', { name: / all$/ });
    expect(toggle()).toHaveTextContent('Collapse all');
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(messaging);
    expect(messaging).toHaveAttribute('aria-expanded', 'false');
    expect(toggle()).toHaveTextContent('Expand all');
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() =>
      expect(within(nav).queryByRole('button', { name: 'SMTP' })).not.toBeInTheDocument(),
    );
    await userEvent.click(messaging);
    expect(messaging).toHaveAttribute('aria-expanded', 'true');
    expect(toggle()).toHaveTextContent('Collapse all');

    await userEvent.click(toggle());
    expect(headers(nav).map((header) => header.getAttribute('aria-expanded'))).toEqual([
      'false',
      'false',
      'false',
    ]);
    expect(toggle()).toHaveTextContent('Expand all');
    await userEvent.click(toggle());
    expect(headers(nav).map((header) => header.getAttribute('aria-expanded'))).toEqual([
      'true',
      'true',
      'true',
    ]);
    expect(within(nav).queryByRole('button', { name: 'Expand all' })).not.toBeInTheDocument();
  });

  it('narrows to matches with their groups held open, and Escape clears the search', async () => {
    const { nav } = renderNav();
    await userEvent.click(within(nav).getByRole('button', { name: 'Collapse all' }));
    const search = within(nav).getByRole('searchbox', { name: 'Search' });

    await userEvent.type(search, 'open');
    expect(headers(nav).map((header) => header.textContent)).toEqual(['AI']);
    expect(headers(nav)[0]).toHaveAttribute('aria-expanded', 'true');
    expect(entryNames(nav)).toEqual(['OpenAI']);
    expect(within(nav).getByRole('button', { name: 'Expand all' })).toBeDisabled();

    await userEvent.keyboard('a');
    expect(search).toHaveValue('opena');
    await userEvent.keyboard('{Escape}');
    expect(search).toHaveValue('');
    expect(headers(nav)).toHaveLength(3);
  });

  it('says so when nothing matches', async () => {
    const { nav } = renderNav();
    await userEvent.type(within(nav).getByRole('searchbox', { name: 'Search' }), ' nothing ');
    expect(within(nav).getByRole('status')).toHaveTextContent('Nothing matches "nothing"');
    expect(entryNames(nav)).toEqual([]);
  });

  it('sorts into one flat list A–Z or Z–A, where folding has nothing to do', async () => {
    const { nav } = renderNav();
    const pickSort = async (label: string) => {
      await userEvent.click(within(nav).getByRole('combobox', { name: 'Sort' }));
      await userEvent.click(screen.getByRole('option', { name: label }));
    };

    await pickSort('Name A–Z');
    expect(headers(nav)).toEqual([]);
    expect(entryNames(nav)).toEqual(['OpenAI', 'Résumé parser', 'Slack', 'SMTP', 'Stripe']);
    expect(within(nav).getByRole('button', { name: 'Collapse all' })).toBeDisabled();

    await pickSort('Name Z–A');
    expect(entryNames(nav)).toEqual(['Stripe', 'SMTP', 'Slack', 'Résumé parser', 'OpenAI']);

    await pickSort('By category');
    expect(headers(nav)).toHaveLength(3);
    expect(within(nav).getByRole('button', { name: 'Collapse all' })).toBeEnabled();
  });

  it('leaves the content unnamed when the open slug is not in the menu', () => {
    renderNav('missing');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.getByText('Panel body')).toBeInTheDocument();
  });
});

describe('PageSideNav on a phone', () => {
  it('becomes one labelled select, grouped by category, above the content', async () => {
    stubPhone();
    const { nav, onSelect } = renderNav('smtp');

    expect(within(nav).queryByRole('searchbox')).not.toBeInTheDocument();
    const select = within(nav).getByRole('combobox', { name: 'Integrations' });
    expect(select).toHaveTextContent('SMTP');
    expect(screen.getByRole('region', { name: 'SMTP' })).toHaveTextContent('Panel body');

    await userEvent.click(select);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Payments')).toBeInTheDocument();
    await userEvent.click(within(listbox).getByRole('option', { name: 'OpenAI' }));
    expect(onSelect).toHaveBeenCalledWith('openai');
  });
});
