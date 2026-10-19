import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({ mounted: [] as ReactElement[] }));

vi.mock('@exyconn/shell/app/mount', () => ({
  mountPortalApp: (app: ReactElement) => calls.mounted.push(app),
}));
vi.mock('../../src/App', () => ({ App: () => null }));

describe('main', () => {
  it('mounts the hub App through the shell, once', async () => {
    const { App } = await import('../../src/App');
    await import('../../src/main');
    expect(calls.mounted).toHaveLength(1);
    expect(calls.mounted[0].type).toBe(App);
  });
});
