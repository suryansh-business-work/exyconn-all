import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { installPortalCrashHandlers, portalLogger } from '@/logging/portalLogger';
import { mountPortalApp } from '@/app/mount';

vi.mock('@/logging/portalLogger', () => ({
  installPortalCrashHandlers: vi.fn(),
  portalLogger: { capture: vi.fn() },
}));

function Crashing(): never {
  throw new Error('Widget exploded');
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.mocked(installPortalCrashHandlers).mockClear();
  vi.mocked(portalLogger.capture).mockClear();
});

function addRoot(): HTMLElement {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.append(root);
  return root;
}

describe('mountPortalApp', () => {
  it('refuses to start without the #root container, after wiring crash reporting', () => {
    expect(() => mountPortalApp(<p>app</p>)).toThrow('Root container #root not found');
    expect(installPortalCrashHandlers).toHaveBeenCalledTimes(1);
  });

  it('renders the app into #root', async () => {
    const root = addRoot();
    await act(async () => {
      mountPortalApp(<p>portal home</p>);
    });

    expect(installPortalCrashHandlers).toHaveBeenCalledTimes(1);
    expect(root).toHaveTextContent('portal home');
  });

  it('reports an app that crashes and shows a retry instead of a blank page', async () => {
    addRoot();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await act(async () => {
      mountPortalApp(<Crashing />);
    });

    expect(screen.getByText('This page hit a problem')).toBeInTheDocument();
    expect(screen.getByText('Widget exploded')).toBeInTheDocument();
    expect(portalLogger.capture).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Widget exploded' }),
      expect.anything(),
    );
    vi.restoreAllMocks();
  });
});
