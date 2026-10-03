/**
 * The redesigned shell pages mount inside the app's providers: the hub (with live search
 * kept in `?q=`), a category page, and the 404 for an unknown category.
 */
import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '../shared/context/ThemeContext';
import { SecretsProvider } from '../shared/context/SecretsContext';
import ToolsPage from '../pages/ToolsPage';
import CategoryPage from '../pages/CategoryPage';
import { findCategoryBySlug, getToolCounts } from '../shared/data/toolsData';

const renderAt = (path: string) =>
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <SecretsProvider>
          <Routes>
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/categories/:slug" element={<CategoryPage />} />
          </Routes>
        </SecretsProvider>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('hub', () => {
  it('renders the hero and one section per category', () => {
    renderAt('/tools');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/free tools that/i);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(getToolCounts().categories);
  });

  it('filters tools as you type and reports no matches', () => {
    renderAt('/tools?q=merge%20pdf');
    expect(screen.getByRole('link', { name: /merge pdf/i })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search tools' }), { target: { value: 'zzzz-nothing' } });
    expect(screen.getByText(/no tools match/i)).toBeInTheDocument();
  });
});

describe('category page', () => {
  it('lists every tool of the category', () => {
    const pdf = findCategoryBySlug('pdf');
    renderAt('/categories/pdf');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('PDF Tools');
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(pdf?.items.length ?? 0);
  });

  it('shows the 404 for an unknown slug', () => {
    renderAt('/categories/unknown');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/isn.t here/i);
  });
});
