import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useTabberSlug } from '../../src/useTabberSlug';

const SLUGS = ['accounts', 'posts', 'calendar'] as const;

/** Shows the full current location, so a test can see what the URL holds. */
function Where() {
  const { pathname, search, hash } = useLocation();
  return <output data-testid="path">{`${pathname}${search}${hash}`}</output>;
}

function Back() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(-1)}>
      Back
    </button>
  );
}

function Harness({ slugs }: Readonly<{ slugs: readonly string[] }>) {
  const { slug, selectSlug } = useTabberSlug('/social', slugs);
  return (
    <>
      <output data-testid="slug">{slug}</output>
      <button type="button" onClick={() => selectSlug('posts')}>
        Go to posts
      </button>
    </>
  );
}

function renderAt(entries: string[], slugs: readonly string[] = SLUGS) {
  render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <Routes>
        <Route path="/social/*" element={<Harness slugs={slugs} />} />
        <Route path="*" element={null} />
      </Routes>
      <Where />
      <Back />
    </MemoryRouter>,
  );
  return userEvent.setup();
}

const path = () => screen.getByTestId('path').textContent;

describe('useTabberSlug', () => {
  it('reads the active tab from the URL without rewriting it', () => {
    renderAt(['/social/calendar?q=1#h']);
    expect(screen.getByTestId('slug')).toHaveTextContent('calendar');
    expect(path()).toBe('/social/calendar?q=1#h');
  });

  it('rewrites the bare base path to the first tab, keeping search and hash', () => {
    renderAt(['/social?q=1#h']);
    expect(screen.getByTestId('slug')).toHaveTextContent('accounts');
    expect(path()).toBe('/social/accounts?q=1#h');
  });

  it('rewrites an unknown slug to the first tab', () => {
    renderAt(['/social/nope']);
    expect(screen.getByTestId('slug')).toHaveTextContent('accounts');
    expect(path()).toBe('/social/accounts');
  });

  it('replaces the history entry on a redirect, so back skips the correction', async () => {
    const user = renderAt(['/home', '/social/nope']);
    expect(path()).toBe('/social/accounts');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(path()).toBe('/home');
  });

  it('leaves the URL alone when there are no tabs at all', () => {
    renderAt(['/social'], []);
    expect(screen.getByTestId('slug')).toBeEmptyDOMElement();
    expect(path()).toBe('/social');
  });

  it('pushes the selected tab, keeping search and hash, so back returns to the last tab', async () => {
    const user = renderAt(['/social/accounts?q=1#h']);
    await user.click(screen.getByRole('button', { name: 'Go to posts' }));
    expect(path()).toBe('/social/posts?q=1#h');
    expect(screen.getByTestId('slug')).toHaveTextContent('posts');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(path()).toBe('/social/accounts?q=1#h');
  });
});
