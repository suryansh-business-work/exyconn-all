import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';

describe('main entry', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts the app into #root', async () => {
    await import('../../main');
    const heading = await screen.findByRole('heading', { level: 1 }, { timeout: 90_000 });
    expect(heading).toHaveTextContent(/free tools that/i);
    expect(document.getElementById('root')?.children.length).toBeGreaterThan(0);
  }, 120_000);
});
