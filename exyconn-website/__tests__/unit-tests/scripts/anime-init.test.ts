// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  installIntersectionObserver,
  lastObserver,
  stubMatchMedia,
  trackDocumentListeners,
} from "./script-dom";

const anime = vi.hoisted(() => ({
  animate: vi.fn(),
  stagger: vi.fn((step: number) => `stagger:${step}`),
}));
vi.mock("animejs", () => anime);

let releaseListeners: () => void;

const boot = async (html: string): Promise<void> => {
  document.body.innerHTML = html;
  vi.resetModules();
  await import("../../../src/scripts/anime-init");
};

const byId = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;

interface AnimeCall {
  duration: number;
  delay: unknown;
  complete: () => void;
  [key: string]: unknown;
}
/** The same element, or a list holding the same elements in the same order. */
const sameTarget = (animated: unknown, target: unknown): boolean => {
  if (Array.isArray(animated) && Array.isArray(target)) {
    return animated.length === target.length && animated.every((item, i) => item === target[i]);
  }
  return animated === target;
};
const callFor = (target: unknown): AnimeCall => {
  const call = anime.animate.mock.calls.find(([animated]) => sameTarget(animated, target));
  if (!call) {
    throw new Error("element was not animated");
  }
  return call[1] as AnimeCall;
};

beforeEach(() => {
  releaseListeners = trackDocumentListeners();
});

afterEach(() => {
  releaseListeners();
  document.documentElement.removeAttribute("data-a11y-motion");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  anime.animate.mockClear();
  anime.stagger.mockClear();
});

describe("anime-init with motion switched off", () => {
  it("shows everything at once when the accessibility drawer pauses animations", async () => {
    document.documentElement.setAttribute("data-a11y-motion", "on");
    await boot(
      '<p id="a" data-anime="zoom-in" style="opacity:0"></p><ul id="b" data-anime-stagger></ul>'
    );
    expect(byId("a").style.opacity).toBe("1");
    expect(byId("b").style.opacity).toBe("1");
    expect(anime.animate).not.toHaveBeenCalled();
  });

  it("honours the reduced-motion media query", async () => {
    stubMatchMedia(true);
    await boot('<p id="a" data-anime="fade-up"></p>');
    expect(byId("a").style.opacity).toBe("1");
    expect(byId("a").style.transform).toBe("");
    expect(anime.animate).not.toHaveBeenCalled();
  });
});

describe("anime-init without IntersectionObserver", () => {
  it("pre-hides each element by its preset and animates it straight away", async () => {
    await boot(
      [
        '<p id="up" data-anime=""></p>',
        '<p id="zoom" data-anime="zoom-in"></p>',
        '<p id="left" data-anime="slide-left"></p>',
        '<p id="right" data-anime="slide-right"></p>',
        '<p id="fade" data-anime="fade-in" data-anime-delay="200" data-anime-duration="400"></p>',
        '<p id="odd" data-anime="spin"></p>',
      ].join("")
    );
    expect(byId("up").style.transform).toBe("translateY(24px)");
    expect(byId("zoom").style.transform).toBe("scale(0.92)");
    expect(byId("left").style.transform).toBe("translateX(-32px)");
    expect(byId("right").style.transform).toBe("translateX(32px)");
    expect(byId("fade").style.transform).toBe("");
    expect(byId("fade").style.opacity).toBe("0");

    expect(callFor(byId("up"))).toMatchObject({ translateY: [24, 0], duration: 700, delay: 0 });
    expect(callFor(byId("fade"))).toMatchObject({ opacity: [0, 1], duration: 400, delay: 200 });
    expect(callFor(byId("fade"))).not.toHaveProperty("translateY");
    // An unknown preset name animates as the default fade-up.
    expect(callFor(byId("odd"))).toMatchObject({ translateY: [24, 0] });
  });

  it("clears will-change once an animation completes", async () => {
    await boot('<p id="a" data-anime="zoom-in"></p>');
    expect(byId("a").style.willChange).toBe("opacity, transform");
    callFor(byId("a")).complete();
    expect(byId("a").style.willChange).toBe("");
  });

  it("staggers the children of a list with its own step and duration", async () => {
    await boot(
      '<ul id="list" data-anime-stagger="slide-right" data-anime-step="120" data-anime-duration="500"><li></li><li></li></ul>'
    );
    const children = [...byId("list").children] as HTMLElement[];
    children.forEach((child) => expect(child.style.transform).toBe("translateX(32px)"));
    const call = callFor(children);
    expect(anime.stagger).toHaveBeenCalledWith(120);
    expect(call).toMatchObject({ translateX: [32, 0], duration: 500, delay: "stagger:120" });
    call.complete();
    children.forEach((child) => expect(child.style.willChange).toBe(""));
  });

  it("staggers with the defaults when the list names no preset", async () => {
    await boot('<ul id="list" data-anime-stagger="" data-anime-step=""><li></li></ul>');
    const children = [...byId("list").children];
    expect(anime.stagger).toHaveBeenCalledWith(80);
    expect(callFor(children)).toMatchObject({ translateY: [24, 0], duration: 700 });
  });
});

describe("anime-init with IntersectionObserver", () => {
  it("animates each element only once it scrolls into view", async () => {
    installIntersectionObserver();
    stubMatchMedia(false);
    await boot(
      '<p id="a" data-anime="fade-in"></p><ul id="list" data-anime-stagger><li></li></ul>'
    );
    const observer = lastObserver();
    expect(observer.options).toEqual({ rootMargin: "0px 0px -10% 0px", threshold: 0.05 });
    expect([...observer.observed]).toEqual([byId("a"), byId("list")]);
    expect(anime.animate).not.toHaveBeenCalled();

    observer.emit([byId("a")], false);
    expect(anime.animate).not.toHaveBeenCalled();

    observer.emit([byId("a"), byId("list")]);
    expect(observer.unobserve).toHaveBeenCalledWith(byId("a"));
    expect(observer.unobserve).toHaveBeenCalledWith(byId("list"));
    expect(callFor(byId("a"))).toMatchObject({ opacity: [0, 1] });
    expect(callFor([...byId("list").children])).toMatchObject({ delay: "stagger:80" });
  });
});

describe("anime-init timing", () => {
  it("waits for DOMContentLoaded while the document is still loading", async () => {
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    await boot('<p id="a" data-anime="fade-up"></p>');
    expect(anime.animate).not.toHaveBeenCalled();
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(callFor(byId("a"))).toMatchObject({ translateY: [24, 0] });
  });
});
