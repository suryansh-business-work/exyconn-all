// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = await vi.hoisted(() => import('./entry-harness'));

vi.mock('@fontsource-variable/inter/wght.css', () => ({}));
vi.mock('react-dom/client', () => ({ createRoot: h.stubs.createRoot }));
vi.mock('@exyconn/logger/react', () => ({ LogErrorBoundary: h.stubs.Boundary }));
vi.mock('../../../src/renderer/App', () => ({ default: h.stubs.App }));
vi.mock('../../../src/renderer/components/CrashFallback', () => ({
  default: h.stubs.CrashFallback,
}));
vi.mock('../../../src/renderer/logger', () => ({
  installRendererCrashHandlers: h.stubs.installRendererCrashHandlers,
  logger: h.stubs.logger,
}));

/** The entry point runs at import, so each case loads it afresh. */
async function start(): Promise<void> {
  vi.resetModules();
  await import('../../../src/renderer/main');
}

beforeEach(h.resetStubs);

describe('the main-window entry point', () => {
  it('reports crashes, then renders the app in strict mode behind the error boundary', async () => {
    const container = h.addRootContainer();

    await start();

    h.expectRenderedBehindBoundary(container, 'main-window');
  });

  it('refuses to start without its root container', async () => {
    await expect(start()).rejects.toThrow('Root container #root was not found');

    expect(h.stubs.createRoot).not.toHaveBeenCalled();
  });
});
