// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bindDrawer } from "../../../../src/scripts/chrome/drawer";
import { stubAnimationFrames, trackDocumentListeners, type FrameControl } from "../script-dom";

const MARKUP = `
  <div id="area"><button id="opener" data-drawer-open="a11y">Accessibility</button></div>
  <button id="menu-opener" data-drawer-open="a11y">Accessibility (menu)</button>
  <div id="a11y" role="dialog" aria-modal="true" data-open="false" tabindex="-1">
    <button id="close" data-drawer-close="a11y">Close</button>
    <button id="to-cookie" data-drawer-open="cookie">Cookies</button>
  </div>
  <div data-drawer-backdrop="a11y" data-open="false"></div>
  <button id="cookie-opener" data-drawer-open="cookie">Cookies</button>
  <div id="cookie" role="dialog" aria-modal="true" data-open="false" tabindex="-1"></div>
  <div data-drawer-backdrop="cookie" data-open="false"></div>
`;

let releaseListeners: () => void;
let frames: FrameControl;
const byId = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;
const backdrop = (id: string): HTMLElement =>
  document.querySelector(`[data-drawer-backdrop="${id}"]`) as HTMLElement;
const locked = () => document.documentElement.classList.contains("chrome-locked");
const escape = () =>
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

const openFromButton = (id: string) => {
  byId(id).focus();
  byId(id).click();
};

beforeEach(() => {
  releaseListeners = trackDocumentListeners();
  frames = stubAnimationFrames();
  document.body.innerHTML = MARKUP;
});

afterEach(() => {
  releaseListeners();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.documentElement.classList.remove("chrome-locked");
});

describe("bindDrawer", () => {
  it("returns null when the drawer or its backdrop is missing", () => {
    expect(bindDrawer("nowhere")).toBeNull();
    backdrop("cookie").remove();
    expect(bindDrawer("cookie")).toBeNull();
  });

  it("opens from any of its buttons, locks the page and focuses the drawer", () => {
    const onOpen = vi.fn();
    bindDrawer("a11y", onOpen);
    openFromButton("opener");
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(byId("a11y").dataset.open).toBe("true");
    expect(backdrop("a11y").dataset.open).toBe("true");
    expect(byId("opener").getAttribute("aria-expanded")).toBe("true");
    expect(byId("menu-opener").getAttribute("aria-expanded")).toBe("true");
    expect(locked()).toBe(true);
    frames.flush();
    expect(document.activeElement).toBe(byId("a11y"));
  });

  it("closes from its close button and returns focus to the opener", () => {
    bindDrawer("a11y");
    openFromButton("opener");
    frames.flush();
    byId("close").click();
    expect(byId("a11y").dataset.open).toBe("false");
    expect(backdrop("a11y").dataset.open).toBe("false");
    expect(byId("opener").getAttribute("aria-expanded")).toBe("false");
    expect(locked()).toBe(false);
    expect(document.activeElement).toBe(byId("opener"));
  });

  it("closes from the backdrop and from Escape, and Escape does nothing while closed", () => {
    bindDrawer("a11y");
    openFromButton("opener");
    backdrop("a11y").click();
    expect(byId("a11y").dataset.open).toBe("false");

    openFromButton("opener");
    escape();
    expect(byId("a11y").dataset.open).toBe("false");

    byId("cookie-opener").focus();
    escape();
    expect(document.activeElement).toBe(byId("cookie-opener"));
  });

  it("hands over to another drawer opened from inside it, without restoring focus", () => {
    bindDrawer("a11y");
    bindDrawer("cookie");
    openFromButton("opener");
    openFromButton("to-cookie");
    expect(byId("a11y").dataset.open).toBe("false");
    expect(byId("cookie").dataset.open).toBe("true");
    expect(locked()).toBe(true);
    expect(document.activeElement).toBe(byId("to-cookie"));
    frames.flush();
    expect(document.activeElement).toBe(byId("cookie"));
  });

  it("stays open when another drawer's button outside it is clicked", () => {
    bindDrawer("a11y");
    openFromButton("opener");
    byId("cookie-opener").click();
    expect(byId("a11y").dataset.open).toBe("true");
  });

  it("ignores clicks that are not on an element", () => {
    bindDrawer("a11y");
    openFromButton("opener");
    document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(byId("a11y").dataset.open).toBe("true");
  });

  it("does not return focus to an opener that is gone or now inert", () => {
    const drawer = bindDrawer("a11y");
    openFromButton("opener");
    frames.flush();
    byId("area").setAttribute("inert", "");
    drawer?.close();
    expect(document.activeElement).toBe(byId("a11y"));

    openFromButton("menu-opener");
    frames.flush();
    byId("menu-opener").remove();
    drawer?.close();
    expect(document.activeElement).toBe(byId("a11y"));
  });

  it("opens and closes through its control, even with nothing focused", () => {
    const drawer = bindDrawer("a11y");
    vi.spyOn(document, "activeElement", "get").mockReturnValue(null);
    drawer?.open();
    expect(byId("a11y").dataset.open).toBe("true");
    drawer?.close();
    expect(byId("a11y").dataset.open).toBe("false");
  });
});
