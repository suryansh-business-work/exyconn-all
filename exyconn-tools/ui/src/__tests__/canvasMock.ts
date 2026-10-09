import { vi } from 'vitest';

/** Replaces `HTMLCanvasElement.prototype.getContext` with a mock that returns whatever `factory` builds. */
export function mockCanvasContext(factory: (this: HTMLCanvasElement) => unknown) {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: vi.fn(factory),
    writable: true,
    configurable: true,
  });
}
