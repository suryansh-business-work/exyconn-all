import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

const mount = vi.hoisted(() => ({ mountPortalApp: vi.fn<(app: ReactElement) => void>() }));

vi.mock('@exyconn/shell/app/mount', () => mount);
vi.mock('../../src/App', () => ({ App: () => null }));

describe('main', () => {
  it('mounts the social App through the shell once', async () => {
    const { App } = await import('../../src/App');
    await import('../../src/main');
    expect(mount.mountPortalApp).toHaveBeenCalledTimes(1);
    expect(mount.mountPortalApp.mock.calls[0][0].type).toBe(App);
  });
});
