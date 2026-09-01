import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

/* ------------------------------------------------------------------ *
 * Shared browser-API stubs.
 *
 * jsdom implements no canvas rendering, no object URLs, no matchMedia and
 * no observers, yet most tools touch at least one of them on first render.
 * These are installed at module scope (i.e. once per test file, before the
 * test file's own code runs) so any suite that wants a sharper mock can
 * simply reassign it in its own `beforeEach` and win.
 * ------------------------------------------------------------------ */

/** A permissive 2d context: every method used across the image/PDF tools. */
const createContext2D = () => ({
  canvas: null as unknown as HTMLCanvasElement,
  globalCompositeOperation: 'source-over',
  globalAlpha: 1,
  fillStyle: '#000000',
  strokeStyle: '#000000',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  filter: 'none',
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'low',
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1, colorSpace: 'srgb' })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1, colorSpace: 'srgb' })),
  measureText: vi.fn(() => ({ width: 10, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 })),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  transform: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  rect: vi.fn(),
  roundRect: vi.fn(),
  arc: vi.fn(),
  arcTo: vi.fn(),
  ellipse: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  clip: vi.fn(),
  isPointInPath: vi.fn(() => false),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  createPattern: vi.fn(() => null),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  setLineDash: vi.fn(),
  getLineDash: vi.fn(() => [] as number[]),
});

HTMLCanvasElement.prototype.getContext = vi.fn(function (this: HTMLCanvasElement, contextId: string) {
  if (contextId === '2d') {
    const context = createContext2D();
    context.canvas = this;
    return context;
  }
  return null;
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.toDataURL = vi.fn(
  () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
);

HTMLCanvasElement.prototype.toBlob = vi.fn(function (callback: BlobCallback, type?: string) {
  callback(new Blob(['canvas'], { type: type ?? 'image/png' }));
}) as unknown as typeof HTMLCanvasElement.prototype.toBlob;

URL.createObjectURL = vi.fn(() => 'blob:mock-object-url') as typeof URL.createObjectURL;
URL.revokeObjectURL = vi.fn() as typeof URL.revokeObjectURL;

globalThis.matchMedia = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(() => false),
})) as unknown as typeof globalThis.matchMedia;

class MockResizeObserver {
  observe = vi.fn();

  unobserve = vi.fn();

  disconnect = vi.fn();
}

class MockIntersectionObserver {
  readonly root: Element | null = null;

  readonly rootMargin: string = '0px';

  readonly thresholds: readonly number[] = [0];

  observe = vi.fn();

  unobserve = vi.fn();

  disconnect = vi.fn();

  takeRecords = vi.fn(() => [] as IntersectionObserverEntry[]);
}

globalThis.ResizeObserver = MockResizeObserver as unknown as typeof globalThis.ResizeObserver;
globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof globalThis.IntersectionObserver;

// jsdom leaves these unimplemented and prints noisy "not implemented" errors.
Element.prototype.scrollIntoView = vi.fn();
globalThis.scrollTo = vi.fn() as unknown as typeof globalThis.scrollTo;

/**
 * Default network stub. Suites that assert on requests override this with
 * their own `vi.stubGlobal('fetch', ...)` in a `beforeEach`, which runs after
 * this module-scope assignment.
 */
globalThis.fetch = vi.fn(async () => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: new Headers(),
  json: async () => ({}),
  text: async () => '',
  blob: async () => new Blob(),
  arrayBuffer: async () => new ArrayBuffer(0),
})) as unknown as typeof globalThis.fetch;
