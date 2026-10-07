// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onceInView, reducedMotion } from "../../../../src/scripts/inner/motion";
import { installIntersectionObserver, lastObserver, stubMatchMedia } from "../script-dom";

afterEach(() => {
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.a11yMotion;
});

describe("reducedMotion", () => {
  it("follows the OS setting", () => {
    const media = stubMatchMedia(true);
    expect(reducedMotion()).toBe(true);
    expect(media.query).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });

  it("follows the site's own switch, and is off otherwise", () => {
    stubMatchMedia(false);
    expect(reducedMotion()).toBe(false);
    document.documentElement.dataset.a11yMotion = "on";
    expect(reducedMotion()).toBe(true);
  });
});

describe("onceInView", () => {
  let first: HTMLElement;
  let second: HTMLElement;

  beforeEach(() => {
    installIntersectionObserver();
    first = document.createElement("div");
    second = document.createElement("div");
  });

  it("calls back once per element, the first time it enters", () => {
    const entered = vi.fn();
    onceInView([first, second], entered);
    const observer = lastObserver();
    expect(observer.options).toEqual({ rootMargin: "0px 0px -12% 0px" });
    expect([...observer.observed]).toEqual([first, second]);

    observer.emit([first, second], false);
    expect(entered).not.toHaveBeenCalled();

    observer.emit([second]);
    expect(entered).toHaveBeenCalledWith(second);
    expect(observer.observed.has(second)).toBe(false);
    expect(observer.observed.has(first)).toBe(true);
  });

  it("takes its own root margin and disconnects on dispose", () => {
    const stop = onceInView(new Set([first]), vi.fn(), "0px");
    const observer = lastObserver();
    expect(observer.options).toEqual({ rootMargin: "0px" });
    stop();
    expect(observer.disconnect).toHaveBeenCalled();
  });
});
