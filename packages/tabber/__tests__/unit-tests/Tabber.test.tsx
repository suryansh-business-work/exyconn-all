import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Tabber } from '../../src/Tabber';
import { filterTabs } from '../../src/filterTabs';
import type { TabberItem } from '../../src/tabber.types';

const ITEMS: TabberItem[] = [
  { slug: 'accounts', label: 'Accounts', content: <p>Accounts body</p> },
  { slug: 'posts', label: 'Posts', content: <p>Posts body</p> },
  { slug: 'calendar', label: 'Calendar', content: <p>Calendar body</p> },
  { slug: 'resume', label: 'Résumé', content: <p>Résumé body</p> },
];

/** Shows the current path, so a test can see which tab the URL holds. */
function Where() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function renderTabber() {
  render(
    <MemoryRouter initialEntries={['/social/accounts']}>
      <Routes>
        <Route
          path="/social/*"
          element={
            <>
              <Tabber basePath="/social" items={ITEMS} ariaLabel="Social media" />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}

const tabNames = () => screen.queryAllByRole('tab').map((tab) => tab.textContent);

describe('filterTabs', () => {
  const label = (item: TabberItem) => item.label;

  it('keeps every tab for an empty or blank search', () => {
    expect(filterTabs(ITEMS, '  ', label)).toHaveLength(ITEMS.length);
  });

  it('matches anywhere in the name, ignoring case and accents', () => {
    expect(filterTabs(ITEMS, 'CAL', label).map((i) => i.slug)).toEqual(['calendar']);
    expect(filterTabs(ITEMS, 'resume', label).map((i) => i.slug)).toEqual(['resume']);
    expect(filterTabs(ITEMS, 'zzz', label)).toEqual([]);
  });
});

describe('Tabber search', () => {
  it('opens a search box from the icon and narrows the tabs as you type', async () => {
    const user = renderTabber();
    expect(tabNames()).toEqual(['Accounts', 'Posts', 'Calendar', 'Résumé']);
    await user.click(screen.getByRole('button', { name: 'Search tabs' }));
    const box = screen.getByRole('textbox', { name: 'Search tabs' });
    expect(box).toHaveFocus();
    await user.type(box, 'po');
    expect(tabNames()).toEqual(['Posts']);
    // The page in view stays put while the strip is narrowed.
    expect(screen.getByText('Accounts body')).toBeInTheDocument();
  });

  it('says so when nothing matches', async () => {
    const user = renderTabber();
    await user.click(screen.getByRole('button', { name: 'Search tabs' }));
    await user.type(screen.getByRole('textbox', { name: 'Search tabs' }), 'zzz');
    expect(tabNames()).toEqual([]);
    expect(screen.getByText('No tabs match "zzz"')).toHaveAttribute('role', 'status');
  });

  it('opens the first match on Enter and puts the strip back', async () => {
    const user = renderTabber();
    await user.click(screen.getByRole('button', { name: 'Search tabs' }));
    await user.type(screen.getByRole('textbox', { name: 'Search tabs' }), 'cal{Enter}');
    expect(screen.getByTestId('path')).toHaveTextContent('/social/calendar');
    expect(screen.getByText('Calendar body')).toBeInTheDocument();
    expect(tabNames()).toHaveLength(ITEMS.length);
    expect(screen.queryByRole('textbox', { name: 'Search tabs' })).not.toBeInTheDocument();
  });

  it('does nothing on Enter when no tab matches', async () => {
    const user = renderTabber();
    await user.click(screen.getByRole('button', { name: 'Search tabs' }));
    await user.type(screen.getByRole('textbox', { name: 'Search tabs' }), 'zzz{Enter}');
    expect(screen.getByTestId('path')).toHaveTextContent('/social/accounts');
  });

  it('closes and clears on Escape or the close button', async () => {
    const user = renderTabber();
    await user.click(screen.getByRole('button', { name: 'Search tabs' }));
    await user.type(screen.getByRole('textbox', { name: 'Search tabs' }), 'po{Escape}');
    expect(tabNames()).toHaveLength(ITEMS.length);
    await user.click(screen.getByRole('button', { name: 'Search tabs' }));
    await user.type(screen.getByRole('textbox', { name: 'Search tabs' }), 'po');
    await user.click(screen.getByRole('button', { name: 'Close tab search' }));
    expect(tabNames()).toHaveLength(ITEMS.length);
    expect(screen.getByRole('button', { name: 'Search tabs' })).toBeInTheDocument();
  });

  it('picking a tab from a narrowed strip opens it and clears the search', async () => {
    const user = renderTabber();
    await user.click(screen.getByRole('button', { name: 'Search tabs' }));
    await user.type(screen.getByRole('textbox', { name: 'Search tabs' }), 'po');
    await user.click(screen.getByRole('tab', { name: 'Posts' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/social/posts');
    expect(tabNames()).toHaveLength(ITEMS.length);
  });

  it('takes row styling as an array and keeps tab icons', () => {
    render(
      <MemoryRouter initialEntries={['/social/accounts']}>
        <Tabber
          basePath="/social"
          items={[{ ...ITEMS[0], icon: <span data-testid="icon" /> }, ITEMS[1]]}
          ariaLabel="Social media"
          sx={[{ mb: 2 }]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(tabNames()).toEqual(['Accounts', 'Posts']);
  });
});
