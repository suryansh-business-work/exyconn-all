// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubAnimationFrames, type FrameControl } from "../script-dom";

let frames: FrameControl;
const button = () => document.getElementById("back-to-top") as HTMLElement;

const boot = async (html: string) => {
  document.body.innerHTML = html;
  vi.resetModules();
  await import("../../../../src/scripts/chrome/back-to-top");
};

const scrollTo = (y: number) => {
  vi.stubGlobal("scrollY", y);
  globalThis.dispatchEvent(new Event("scroll"));
};

beforeEach(() => {
  frames = stubAnimationFrames();
  vi.stubGlobal("scrollY", 0);
  vi.stubGlobal("innerHeight", 800);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("back to top", () => {
  // First, before any other test's module is listening for scrolls.
  it("does nothing on a page without the button", async () => {
    await boot("<main></main>");
    scrollTo(3000);
    expect(frames.request).not.toHaveBeenCalled();
  });

  it("measures once per frame however many scroll events arrive", async () => {
    await boot('<button id="back-to-top" data-visible="false"></button>');
    scrollTo(2000);
    scrollTo(2100);
    expect(frames.request).toHaveBeenCalledTimes(1);
  });

  it("shows while the reader heads back up a long page and hides on the way down", async () => {
    await boot('<button id="back-to-top" data-visible="false"></button>');
    scrollTo(2000);
    frames.flush();
    expect(button().dataset.visible).toBe("false");

    scrollTo(1500);
    frames.flush();
    expect(button().dataset.visible).toBe("true");

    scrollTo(1800);
    frames.flush();
    expect(button().dataset.visible).toBe("false");
  });

  it("keeps its state when a frame finds the page where it was", async () => {
    await boot('<button id="back-to-top" data-visible="false"></button>');
    scrollTo(2000);
    frames.flush();
    scrollTo(1500);
    frames.flush();
    scrollTo(1500);
    frames.flush();
    expect(button().dataset.visible).toBe("true");
  });

  it("scrolls to the top, hides and moves focus to the main content", async () => {
    const scroll = vi.fn();
    vi.stubGlobal("scrollTo", scroll);
    await boot(
      '<main id="main-content" tabindex="-1"></main><button id="back-to-top" data-visible="true"></button>'
    );
    button().click();
    expect(button().dataset.visible).toBe("false");
    expect(scroll).toHaveBeenCalledWith({ top: 0 });
    expect(document.activeElement?.id).toBe("main-content");
  });

  it("still scrolls up on a page without a main landmark", async () => {
    const scroll = vi.fn();
    vi.stubGlobal("scrollTo", scroll);
    await boot('<button id="back-to-top" data-visible="true"></button>');
    button().click();
    expect(scroll).toHaveBeenCalledWith({ top: 0 });
  });
});
