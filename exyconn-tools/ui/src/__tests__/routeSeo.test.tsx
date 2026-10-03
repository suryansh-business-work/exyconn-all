/**
 * Client-side navigation keeps the head in sync with the prerendered meta: RouteSeo
 * re-applies `metaForPath` on every route change and leaves exactly one set of tags.
 */
import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import RouteSeo from '../shared/seo/RouteSeo';
import { metaForPath } from '../shared/seo/routes';

const PATHS = ['/tools/merge-pdf', '/categories/pdf', '/missing'];

/** One button per target path, so the test navigates the way a link click would. */
const Navigator = () => {
  const navigate = useNavigate();
  return (
    <>
      {PATHS.map((path) => (
        <button key={path} type="button" onClick={() => navigate(path)}>
          {path}
        </button>
      ))}
    </>
  );
};

const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');
const go = (path: string) => fireEvent.click(screen.getByRole('button', { name: path }));

describe('RouteSeo', () => {
  it('applies the meta of each route it navigates to', () => {
    render(
      <MemoryRouter initialEntries={['/tools']}>
        <RouteSeo />
        <Navigator />
      </MemoryRouter>
    );
    expect(document.title).toBe(metaForPath('/tools').title);
    expect(canonical()).toBe('https://tools.exyconn.com/tools');

    go('/tools/merge-pdf');
    expect(document.title).toBe(metaForPath('/tools/merge-pdf').title);
    expect(canonical()).toBe('https://tools.exyconn.com/tools/merge-pdf');
    expect(document.head.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(
      metaForPath('/tools/merge-pdf').jsonLd?.length ?? 0
    );

    go('/categories/pdf');
    expect(canonical()).toBe('https://tools.exyconn.com/categories/pdf');
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);

    go('/missing');
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow');
  });
});
