import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

type HeaderBuilder = () => Record<string, string>;

const shell = vi.hoisted(() => ({
  mountPortalApp: vi.fn<(app: ReactElement) => void>(),
  withoutPortalSession: vi.fn<() => void>(),
  setAppRequestHeaders: vi.fn<(build: HeaderBuilder) => void>(),
}));

vi.mock('@exyconn/shell/app/mount', () => ({ mountPortalApp: shell.mountPortalApp }));
vi.mock('@exyconn/shell/config/apolloClient', () => ({
  withoutPortalSession: shell.withoutPortalSession,
  setAppRequestHeaders: shell.setAppRequestHeaders,
}));
vi.mock('../../src/App', () => ({ App: () => null }));

describe('main', () => {
  it('drops the portal session, wires the client pass, then mounts the App once', async () => {
    const { App } = await import('../../src/App');
    const { clientPass } = await import('../../src/auth/clientPass');
    await import('../../src/main');

    expect(shell.withoutPortalSession).toHaveBeenCalledTimes(1);
    expect(shell.setAppRequestHeaders).toHaveBeenCalledTimes(1);
    expect(shell.mountPortalApp).toHaveBeenCalledTimes(1);
    expect(shell.mountPortalApp.mock.calls[0][0].type).toBe(App);
    // The session is dropped and the pass wired before anything renders.
    const mountedAt = shell.mountPortalApp.mock.invocationCallOrder[0];
    expect(shell.withoutPortalSession.mock.invocationCallOrder[0]).toBeLessThan(mountedAt);
    expect(shell.setAppRequestHeaders.mock.invocationCallOrder[0]).toBeLessThan(mountedAt);

    const headers = shell.setAppRequestHeaders.mock.calls[0][0];
    expect(headers()).toEqual({});
    const pass = `pass-${Date.now()}`;
    clientPass.store(pass);
    expect(headers()).toEqual({ 'x-client-pass': pass });
    clientPass.clear();
  });
});
