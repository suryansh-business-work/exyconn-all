// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootCounters, COUNT_MS } from "../../../../src/scripts/inner/counters";
import {
  FakeIntersectionObserver,
  installIntersectionObserver,
  lastObserver,
  stubAnimationFrames,
  stubMatchMedia,
  type FrameControl,
} from "../script-dom";

const START = 1000;
let frames: FrameControl;
const stat = (id: string) => document.getElementById(id) as HTMLElement;

beforeEach(() => {
  installIntersectionObserver();
  frames = stubAnimationFrames();
  vi.spyOn(performance, "now").mockReturnValue(START);
  document.body.innerHTML = `
    <p id="clients" data-count>1,200+ clients</p>
    <p id="uptime" data-count>99.9% uptime</p>
    <p id="plain">42 people</p>
  `;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("bootCounters", () => {
  it("leaves the final numbers alone under reduced motion", () => {
    stubMatchMedia(true);
    bootCounters();
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(stat("clients").textContent).toBe("1,200+ clients");
  });

  it("watches only the marked stats", () => {
    stubMatchMedia(false);
    bootCounters();
    expect([...lastObserver().observed]).toEqual([stat("clients"), stat("uptime")]);
  });

  it("counts a stat up from zero once it is in view, keeping its format", () => {
    stubMatchMedia(false);
    bootCounters();
    expect(frames.pending()).toBe(0);
    lastObserver().emit([stat("clients")]);

    frames.flush(START);
    expect(stat("clients").textContent).toBe("0+ clients");
    frames.flush(START + COUNT_MS / 2);
    expect(stat("clients").textContent).toBe("1,050+ clients");
    expect(frames.pending()).toBe(1);

    frames.flush(START + COUNT_MS);
    expect(stat("clients").textContent).toBe("1,200+ clients");
    expect(frames.pending()).toBe(0);
    expect(stat("uptime").textContent).toBe("99.9% uptime");
  });

  it("keeps the decimals of a stat while it counts", () => {
    stubMatchMedia(false);
    bootCounters();
    lastObserver().emit([stat("uptime")]);
    frames.flush(START + COUNT_MS / 2);
    expect(stat("uptime").textContent).toBe("87.4% uptime");
    frames.flush(START + COUNT_MS * 2);
    expect(stat("uptime").textContent).toBe("99.9% uptime");
  });
});
