import { isValidElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { mountPortalApp } from '@exyconn/shell/app/mount';
import { App } from '../../src/App';

vi.mock('@exyconn/shell/app/mount', () => ({ mountPortalApp: vi.fn() }));

vi.mock('../../src/App', () => ({ App: () => null }));

describe('main', () => {
  it('mounts the Website app into the page once', async () => {
    await import('../../src/main');

    expect(mountPortalApp).toHaveBeenCalledTimes(1);
    const [element] = vi.mocked(mountPortalApp).mock.calls[0];
    expect(isValidElement(element) && element.type).toBe(App);
  });
});
