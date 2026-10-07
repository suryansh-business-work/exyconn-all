import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({ order: [] as string[], mounted: null as ReactElement | null }));

vi.mock('@exyconn/shell/app/mount', () => ({
  mountPortalApp: (app: ReactElement) => {
    calls.order.push('mount');
    calls.mounted = app;
  },
}));
vi.mock('../../src/visitor/visitorPass', () => ({
  installVisitorPass: () => calls.order.push('install pass'),
}));
vi.mock('../../src/App', () => ({ App: () => null }));

describe('main', () => {
  it('installs the visitor pass before mounting the App through the shell, once', async () => {
    const { App } = await import('../../src/App');
    await import('../../src/main');
    expect(calls.order).toEqual(['install pass', 'mount']);
    expect(calls.mounted?.type).toBe(App);
  });
});
