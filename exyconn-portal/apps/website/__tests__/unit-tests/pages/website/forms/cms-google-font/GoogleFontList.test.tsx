import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleFontList } from '../../../../../../src/pages/website/forms/cms-google-font/GoogleFontList';
import type { GoogleFontRow } from '../../../../../../src/pages/website/forms/cms-google-font';
import type { useGoogleFontCatalogue } from '../../../../../../src/pages/website/forms/cms-google-font/useGoogleFontCatalogue';
import { renderWithProviders } from '../../../../test-utils';

type Catalogue = ReturnType<typeof useGoogleFontCatalogue>;

const inter: GoogleFontRow = {
  family: 'Inter',
  category: 'Sans Serif',
  variants: ['400', '700', '700i'],
  subsets: ['latin'],
  popularity: 1,
};
const lora: GoogleFontRow = {
  family: 'Lora',
  category: 'Serif',
  variants: ['500'],
  subsets: ['latin'],
  popularity: 2,
};

function catalogue(overrides: Partial<Catalogue> = {}): Catalogue {
  return {
    rows: [inter, lora],
    totalCount: 2,
    loading: false,
    error: undefined,
    search: '',
    setSearch: vi.fn(),
    category: '',
    setCategory: vi.fn(),
    hasMore: false,
    showMore: vi.fn(),
    ...overrides,
  };
}

const stylesheets = () =>
  [...document.head.querySelectorAll('link[rel="stylesheet"]')].map((link) =>
    link.getAttribute('href'),
  );

describe('GoogleFontList', () => {
  afterEach(() => {
    document.head.querySelectorAll('link[rel="stylesheet"]').forEach((link) => link.remove());
  });

  it('lists each family with its category and number of styles, and picks one', async () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <GoogleFontList catalogue={catalogue()} selected="Lora" onSelect={onSelect} />,
    );

    expect(screen.getByRole('region', { name: 'Google Fonts families' })).toBeInTheDocument();
    expect(screen.getByText('Sans Serif · 3 styles')).toBeInTheDocument();
    expect(screen.getByText('Serif · 1 styles')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lora/ })).toHaveClass('Mui-selected');
    expect(screen.getByRole('button', { name: /Inter/ })).not.toHaveClass('Mui-selected');

    await userEvent.setup().click(screen.getByRole('button', { name: /Inter/ }));
    expect(onSelect).toHaveBeenCalledWith(inter);
  });

  it('loads only the letters of the listed names, each in its list style', () => {
    renderWithProviders(<GoogleFontList catalogue={catalogue()} selected="" onSelect={vi.fn()} />);

    const [url] = stylesheets();
    expect(url).toContain('family=Inter:ital,wght@0,400');
    expect(url).toContain('family=Lora:ital,wght@0,500');
    expect(url).toContain(`&text=${encodeURIComponent('InterLoa')}`);
  });

  it('loads nothing when no family is listed', () => {
    renderWithProviders(
      <GoogleFontList catalogue={catalogue({ rows: [] })} selected="" onSelect={vi.fn()} />,
    );
    expect(stylesheets()).toEqual([]);
  });

  it('shows progress and the catalogue error', () => {
    renderWithProviders(
      <GoogleFontList
        catalogue={catalogue({ loading: true, error: new Error('Catalogue unavailable') })}
        selected=""
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('progressbar', { name: 'Loading fonts' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Catalogue unavailable');
  });

  it('offers the next page while more families remain', async () => {
    const showMore = vi.fn();
    renderWithProviders(
      <GoogleFontList
        catalogue={catalogue({ hasMore: true, totalCount: 90, showMore })}
        selected=""
        onSelect={vi.fn()}
      />,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'Show more (2 of 90)' }));
    expect(showMore).toHaveBeenCalledTimes(1);
  });

  it('holds the next page back while a page is loading', () => {
    renderWithProviders(
      <GoogleFontList
        catalogue={catalogue({ hasMore: true, totalCount: 90, loading: true })}
        selected=""
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Show more (2 of 90)' })).toBeDisabled();
  });

  it('hides the next-page button once everything is listed', () => {
    renderWithProviders(<GoogleFontList catalogue={catalogue()} selected="" onSelect={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Show more/ })).not.toBeInTheDocument();
  });
});
