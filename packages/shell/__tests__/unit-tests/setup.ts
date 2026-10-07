import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

/**
 * The auth stores, colour mode and sidebar state persist in localStorage and the session in a
 * cookie; clearing both after each test keeps one test's sign-in from leaking into the next.
 */
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  for (const cookie of document.cookie.split('; ')) {
    const name = cookie.split('=')[0];
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  }
});
