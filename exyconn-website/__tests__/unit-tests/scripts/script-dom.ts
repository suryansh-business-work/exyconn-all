/**
 * Browser stand-ins for the page scripts under src/scripts. jsdom has no IntersectionObserver
 * or matchMedia and paints no frames, so these let a test decide when an element enters the
 * viewport, which media query matches and when the next animation frame runs.
 *
 * Every page script binds listeners on `document` when it is imported; `trackDocumentListeners`
 * removes them again so one test's module never answers another test's events.
 */
import { vi } from "vitest";

export function trackDocumentListeners(): () => void {
  const spy = vi.spyOn(document, "addEventListener");
  return () => {
    for (const [type, listener, options] of spy.mock.calls) {
      document.removeEventListener(type, listener, options);
    }
    spy.mockRestore();
  };
}

export interface ObservedEntry {
  target: Element;
  isIntersecting: boolean;
}

export class FakeIntersectionObserver {
  static readonly instances: FakeIntersectionObserver[] = [];
  readonly observed = new Set<Element>();
  readonly observe = vi.fn((target: Element) => {
    this.observed.add(target);
  });
  readonly unobserve = vi.fn((target: Element) => {
    this.observed.delete(target);
  });
  readonly disconnect = vi.fn(() => {
    this.observed.clear();
  });

  constructor(
    readonly callback: (entries: ObservedEntry[]) => void,
    readonly options?: IntersectionObserverInit
  ) {
    FakeIntersectionObserver.instances.push(this);
  }

  /** Reports `targets` as entering (or, with `false`, outside) the viewport. */
  emit(targets: readonly Element[], isIntersecting = true): void {
    this.callback(targets.map((target) => ({ target, isIntersecting })));
  }
}

export function installIntersectionObserver(): typeof FakeIntersectionObserver {
  FakeIntersectionObserver.instances.length = 0;
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  return FakeIntersectionObserver;
}

/** The observer created last; fails the test when none was. */
export function lastObserver(): FakeIntersectionObserver {
  const observer = FakeIntersectionObserver.instances.at(-1);
  if (!observer) {
    throw new Error("No IntersectionObserver was created");
  }
  return observer;
}

export interface MediaControl {
  query: ReturnType<typeof vi.fn>;
  /** Changes the answer and tells every `change` listener. */
  change: (matches: boolean) => void;
}

export function stubMatchMedia(initial: boolean): MediaControl {
  const state = { matches: initial };
  const listeners: Array<() => void> = [];
  const query = vi.fn((media: string) => ({
    media,
    get matches() {
      return state.matches;
    },
    addEventListener: (_type: string, listener: () => void) => {
      listeners.push(listener);
    },
  }));
  vi.stubGlobal("matchMedia", query);
  return {
    query,
    change: (matches) => {
      state.matches = matches;
      listeners.forEach((listener) => listener());
    },
  };
}

export interface FrameControl {
  request: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
  pending: () => number;
  /** Runs the frames queued so far (not the ones they queue) at `time`. */
  flush: (time?: number) => void;
}

export function stubAnimationFrames(): FrameControl {
  const callbacks = new Map<number, FrameRequestCallback>();
  let next = 0;
  const request = vi.fn((callback: FrameRequestCallback) => {
    next += 1;
    callbacks.set(next, callback);
    return next;
  });
  const cancel = vi.fn((id: number) => {
    callbacks.delete(id);
  });
  vi.stubGlobal("requestAnimationFrame", request);
  vi.stubGlobal("cancelAnimationFrame", cancel);
  return {
    request,
    cancel,
    pending: () => callbacks.size,
    flush: (time = 0) => {
      const due = [...callbacks.values()];
      callbacks.clear();
      due.forEach((callback) => callback(time));
    },
  };
}

/**
 * Gives elements a layout box (jsdom reports none), so focus-trap code sees them as shown;
 * an element marked `data-no-box` stays boxless, like one under `display: none`.
 */
export function giveElementsBoxes(): void {
  vi.spyOn(Element.prototype, "getClientRects").mockImplementation(function (this: HTMLElement) {
    return { length: this.dataset.noBox === undefined ? 1 : 0 } as unknown as DOMRectList;
  });
}
