/**
 * Shared by the two renderer entry-point tests (main.tsx and screenshots.tsx), which differ
 * only in the app they mount and the name they log under. Each test mocks the entry's imports
 * with these stubs (loaded through `vi.hoisted`) and checks what was handed to React.
 */
import { StrictMode, type ReactElement } from 'react';
import { expect, vi } from 'vitest';

export const stubs = {
  render: vi.fn(),
  createRoot: vi.fn(),
  installRendererCrashHandlers: vi.fn(),
  logger: { setRoute: vi.fn() },
  App: () => null,
  Boundary: () => null,
  CrashFallback: () => null,
};

type Fallback = (
  error: Error,
  reset: () => void,
) => ReactElement<{
  error: Error;
  onRetry: () => void;
}>;

interface BoundaryProps {
  logger: unknown;
  fallback: Fallback;
  children: ReactElement;
}

export function resetStubs(): void {
  stubs.render.mockClear();
  stubs.createRoot.mockReset().mockReturnValue({ render: stubs.render });
  stubs.installRendererCrashHandlers.mockClear();
  document.body.innerHTML = '';
}

/** The `#root` element both HTML pages carry. */
export function addRootContainer(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'root';
  document.body.append(container);
  return container;
}

/** Crash reporting first, then the app in strict mode behind a boundary with a retry fallback. */
export function expectRenderedBehindBoundary(container: HTMLElement, windowName: string): void {
  expect(stubs.installRendererCrashHandlers).toHaveBeenCalledWith(windowName);
  expect(stubs.createRoot).toHaveBeenCalledWith(container);

  const strict = stubs.render.mock.calls[0][0] as ReactElement<{ children: ReactElement }>;
  expect(strict.type).toBe(StrictMode);
  const boundary = strict.props.children as ReactElement<BoundaryProps>;
  expect(boundary.type).toBe(stubs.Boundary);
  expect(boundary.props.logger).toBe(stubs.logger);
  expect(boundary.props.children.type).toBe(stubs.App);

  const error = new Error('render failed');
  const reset = vi.fn();
  const fallback = boundary.props.fallback(error, reset);
  expect(fallback.type).toBe(stubs.CrashFallback);
  expect(fallback.props).toEqual({ error, onRetry: reset });
}
