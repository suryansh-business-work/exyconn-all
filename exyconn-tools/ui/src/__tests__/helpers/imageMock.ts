/**
 * A stand-in for `Image` that loads (or fails) on demand, so a test decides when the browser
 * would have decoded the picture and how big it is.
 */
import { vi } from 'vitest';

export interface FakeImageOptions {
  width?: number;
  height?: number;
  /** What `img.complete` reports straight after `src` is set. */
  complete?: boolean;
  /** Fire `load` on its own, in a microtask, once `src` is set. */
  autoLoad?: boolean;
  /** Fire `error` instead of `load` for these sources. */
  failFor?: (src: string) => boolean;
}

export class FakeImage {
  static instances: FakeImage[] = [];

  static options: FakeImageOptions = {};

  onload: ((event?: Event) => void) | null = null;

  onerror: ((event?: Event) => void) | null = null;

  crossOrigin: string | null = null;

  width = 100;

  height = 50;

  naturalWidth = 100;

  naturalHeight = 50;

  complete = false;

  private source = '';

  private readonly listeners: Record<string, Array<() => void>> = {};

  constructor() {
    const { width = 100, height = 50, complete = false } = FakeImage.options;
    this.width = width;
    this.height = height;
    this.naturalWidth = width;
    this.naturalHeight = height;
    this.complete = complete;
    FakeImage.instances.push(this);
  }

  addEventListener(type: string, listener: () => void) {
    (this.listeners[type] ??= []).push(listener);
  }

  get src() {
    return this.source;
  }

  set src(value: string) {
    this.source = value;
    const { autoLoad = false, failFor } = FakeImage.options;
    if (failFor?.(value)) {
      queueMicrotask(() => this.fire('error'));
    } else if (autoLoad) {
      queueMicrotask(() => this.fire('load'));
    }
  }

  fire(type: 'load' | 'error') {
    this.listeners[type]?.forEach((listener) => listener());
    const event = new Event(type);
    if (type === 'load') this.onload?.(event);
    else this.onerror?.(event);
  }
}

/** Replaces the global `Image`; `FakeImage.instances` lists what the code under test created. */
export function installFakeImage(options: FakeImageOptions = {}) {
  FakeImage.instances = [];
  FakeImage.options = options;
  vi.stubGlobal('Image', FakeImage);
  return FakeImage;
}
