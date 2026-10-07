import { vi } from 'vitest';
import { View } from './host';

/** A value that jumps straight to its target: animations finish synchronously on `start`. */
class AnimatedValue {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  setValue(next: number): void {
    this.value = next;
  }

  getValue(): number {
    return this.value;
  }

  interpolate(config: unknown): { config: unknown; source: AnimatedValue } {
    return { config, source: this };
  }
}

interface Animation {
  start: (done?: (result: { finished: boolean }) => void) => void;
  stop: () => void;
  reset: () => void;
}

function animation(run: () => void = () => undefined): Animation {
  return {
    start: vi.fn((done?: (result: { finished: boolean }) => void) => {
      run();
      done?.({ finished: true });
    }),
    stop: vi.fn(),
    reset: vi.fn(),
  };
}

type Easing = (t: number) => number;

export const Animated = {
  Value: AnimatedValue,
  View,
  timing: vi.fn((value: AnimatedValue, config: { toValue: number }) =>
    animation(() => value.setValue(config.toValue)),
  ),
  spring: vi.fn((value: AnimatedValue, config: { toValue: number }) =>
    animation(() => value.setValue(config.toValue)),
  ),
  /** A loop never finishes by itself, so its `start` runs the inner animation once. */
  loop: vi.fn((inner: Animation) => ({
    start: vi.fn(() => inner.start()),
    stop: vi.fn(),
    reset: vi.fn(),
  })),
  sequence: vi.fn((parts: Animation[]) => animation(() => parts.forEach((part) => part.start()))),
  parallel: vi.fn((parts: Animation[]) => animation(() => parts.forEach((part) => part.start()))),
  createAnimatedComponent: <T,>(component: T): T => component,
  event: vi.fn(() => vi.fn()),
};

const identity: Easing = (t) => t;
const passThrough = (easing: Easing): Easing => easing;

export const Easing = {
  linear: identity,
  ease: identity,
  quad: (t: number) => t * t,
  in: passThrough,
  out: passThrough,
  inOut: passThrough,
  bezier: (): Easing => identity,
};
