import { vi } from 'vitest';

/** What a drawn stroke reads back as. */
export const DRAWN = 'data:image/png;base64,RFJBV04=';
/** What a typed name renders to. */
export const TYPED = 'data:image/png;base64,VFlQRUQ=';

/**
 * Stands in for `signature_pad`, which draws on a real canvas jsdom does not have. Each pad
 * records its listeners so a test can finish a stroke, and whether it was cleared or torn down.
 */
export class FakeSignaturePad {
  static readonly instances: FakeSignaturePad[] = [];
  readonly options: unknown;
  readonly listeners = new Map<string, () => void>();
  readonly clear = vi.fn();
  readonly off = vi.fn();
  empty = false;

  constructor(
    readonly canvas: HTMLCanvasElement,
    options: unknown,
  ) {
    this.options = options;
    FakeSignaturePad.instances.push(this);
  }

  addEventListener(event: string, listener: () => void) {
    this.listeners.set(event, listener);
  }

  removeEventListener(event: string) {
    this.listeners.delete(event);
  }

  isEmpty() {
    return this.empty;
  }

  toDataURL(type: string) {
    return type === 'image/png' ? DRAWN : '';
  }

  /** Lifts the pen, as the library does at the end of a stroke. */
  endStroke() {
    this.listeners.get('endStroke')?.();
  }

  static latest(): FakeSignaturePad {
    const pad = FakeSignaturePad.instances.at(-1);
    if (!pad) {
      throw new Error('No signature pad was created');
    }
    return pad;
  }
}

/** A 2D context with just what the pad and the typed signature use. */
export const fakeContext = () => ({
  scale: vi.fn(),
  fillText: vi.fn(),
  fillStyle: '',
  font: '',
  textBaseline: '',
});

/** Gives every canvas a fake context (or none) and the typed-signature PNG. */
export function stubCanvas(context: ReturnType<typeof fakeContext> | null = fakeContext()) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(TYPED);
  return context;
}
