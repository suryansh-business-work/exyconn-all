import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useGoogleFontCatalogue } from '../../../../../../src/pages/website/forms/cms-google-font/useGoogleFontCatalogue';

const gql = vi.hoisted(() => ({ fonts: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsGoogleFontsQuery: (options: unknown) => gql.fonts(options),
}));

const row = (family: string) => ({
  family,
  category: 'Sans Serif',
  variants: ['400'],
  subsets: ['latin'],
  popularity: 1,
});

/** The variables of the latest catalogue request. */
const lastRequest = () => gql.fonts.mock.lastCall?.[0];

describe('useGoogleFontCatalogue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    gql.fonts.mockReset().mockReturnValue({ data: undefined, loading: true, error: undefined });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks for the first page of every family, only while open', () => {
    const { result } = renderHook(() => useGoogleFontCatalogue(false));

    expect(lastRequest()).toEqual({
      variables: { search: null, category: null, limit: 30 },
      skip: true,
      fetchPolicy: 'cache-first',
    });
    expect(result.current.rows).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.loading).toBe(true);
    expect(result.current.hasMore).toBe(false);
  });

  it('hands over the rows and whether more remain', () => {
    const failure = new Error('Catalogue unavailable');
    gql.fonts.mockReturnValue({
      data: { cmsGoogleFonts: { rows: [row('Inter'), row('Lora')], totalCount: 40 } },
      loading: false,
      error: failure,
    });
    const { result } = renderHook(() => useGoogleFontCatalogue(true));

    expect(lastRequest()?.skip).toBe(false);
    expect(result.current.rows.map((font) => font.family)).toEqual(['Inter', 'Lora']);
    expect(result.current.totalCount).toBe(40);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBe(failure);
  });

  it('searches the trimmed text once typing pauses', () => {
    const { result } = renderHook(() => useGoogleFontCatalogue(true));

    act(() => result.current.setSearch('  inter '));
    expect(result.current.search).toBe('  inter ');
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(lastRequest()?.variables.search).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(lastRequest()?.variables).toEqual({ search: 'inter', category: null, limit: 30 });
  });

  it('grows a page at a time and starts over for a new category or search', () => {
    const { result } = renderHook(() => useGoogleFontCatalogue(true));

    act(() => result.current.showMore());
    act(() => result.current.showMore());
    expect(lastRequest()?.variables.limit).toBe(90);

    act(() => result.current.setCategory('Serif'));
    expect(result.current.category).toBe('Serif');
    expect(lastRequest()?.variables).toEqual({ search: null, category: 'Serif', limit: 30 });

    act(() => result.current.showMore());
    act(() => result.current.setSearch('lora'));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(lastRequest()?.variables).toEqual({ search: 'lora', category: 'Serif', limit: 30 });
  });
});
