// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootReading } from "../../../../src/scripts/inner/toc";
import {
  installIntersectionObserver,
  lastObserver,
  stubAnimationFrames,
  stubMatchMedia,
  type FrameControl,
} from "../script-dom";

const TOC = `
  <details class="inner-toc">
    <summary>On this page</summary>
    <a id="to-intro" href="#intro">Intro</a>
    <a id="to-cafe" href="#caf%C3%A9">Café</a>
    <a id="to-missing" href="#missing">Missing</a>
    <a id="away" href="/elsewhere">Elsewhere</a>
  </details>
  <section id="intro"></section>
  <section id="café"></section>
`;

let frames: FrameControl;
const byId = (id: string) => document.getElementById(id) as HTMLElement;

beforeEach(() => {
  installIntersectionObserver();
  frames = stubAnimationFrames();
  vi.stubGlobal("innerHeight", 1000);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("bootReading table of contents", () => {
  it("is always open on wide screens", () => {
    const media = stubMatchMedia(true);
    document.body.innerHTML = TOC;
    bootReading();
    expect(media.query).toHaveBeenCalledWith("(min-width: 1024px)");
    expect(document.querySelector<HTMLDetailsElement>("details")?.open).toBe(true);
  });

  it("watches each section it links to, decoding the link", () => {
    stubMatchMedia(false);
    document.body.innerHTML = TOC;
    bootReading();
    expect([...lastObserver().observed]).toEqual([byId("intro"), byId("café")]);
    expect(lastObserver().options).toEqual({ rootMargin: "-20% 0px -70% 0px" });
  });

  it("marks the link of the section being read as current", () => {
    stubMatchMedia(false);
    document.body.innerHTML = TOC;
    bootReading();
    const observer = lastObserver();
    observer.emit([byId("café")]);
    expect(byId("to-cafe").getAttribute("aria-current")).toBe("true");
    expect(byId("to-intro").hasAttribute("aria-current")).toBe(false);
    observer.emit([byId("intro")], false);
    expect(byId("to-cafe").getAttribute("aria-current")).toBe("true");
    observer.emit([byId("intro")]);
    expect(byId("to-cafe").hasAttribute("aria-current")).toBe(false);
    expect(byId("to-intro").getAttribute("aria-current")).toBe("true");
    expect(byId("away").hasAttribute("aria-current")).toBe(false);
  });
});

const boxAt = (top: number, height: number) =>
  vi.spyOn(byId("article"), "getBoundingClientRect").mockReturnValue({ top, height } as DOMRect);
const fill = (bar: string) => (byId(bar).firstElementChild as HTMLElement).style.transform;

describe("bootReading progress bar", () => {
  // First, before any bar in this file listens for scrolls.
  it("skips bars whose target or fill is missing", () => {
    document.body.innerHTML = `
      <article id="article"></article>
      <div id="lost" data-reading-progress="nowhere"><span></span></div>
      <div id="empty" data-reading-progress="article"></div>
    `;
    expect(() => bootReading()).not.toThrow();
    expect(fill("lost")).toBe("");
    globalThis.dispatchEvent(new Event("scroll"));
    expect(frames.request).not.toHaveBeenCalled();
  });

  it("fills with how far the reader is through the target, once per frame", () => {
    document.body.innerHTML = `<article id="article"></article><div id="bar" data-reading-progress="article"><span></span></div>`;
    const box = boxAt(-500, 2000);
    bootReading();
    expect(fill("bar")).toBe("scaleX(0.5)");

    box.mockReturnValue({ top: -1000, height: 2000 } as DOMRect);
    globalThis.dispatchEvent(new Event("scroll"));
    globalThis.dispatchEvent(new Event("scroll"));
    expect(frames.request).toHaveBeenCalledTimes(1);
    expect(fill("bar")).toBe("scaleX(0.5)");
    frames.flush();
    expect(fill("bar")).toBe("scaleX(1)");
  });

  it("repaints after a resize", () => {
    document.body.innerHTML = `<article id="article"></article><div id="bar" data-reading-progress="article"><span></span></div>`;
    const box = boxAt(200, 2000);
    bootReading();
    expect(fill("bar")).toBe("scaleX(0)");
    box.mockReturnValue({ top: -250, height: 2000 } as DOMRect);
    globalThis.dispatchEvent(new Event("resize"));
    frames.flush();
    expect(fill("bar")).toBe("scaleX(0.25)");
  });
});
