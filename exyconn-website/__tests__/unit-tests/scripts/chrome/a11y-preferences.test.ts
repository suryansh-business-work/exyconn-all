// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { A11Y_STORAGE_KEY, A11Y_TOGGLE_IDS } from "../../../../src/lib/chrome/preferences";
import { stubAnimationFrames, trackDocumentListeners } from "../script-dom";

/** Every toggle but "cursor", so a drawer missing one control is covered too. */
const toggles = A11Y_TOGGLE_IDS.filter((id) => id !== "cursor")
  .map((id) => `<input type="checkbox" data-a11y-toggle="${id}" />`)
  .join("");

const MARKUP = `
  <button id="open" data-drawer-open="a11y-drawer">Accessibility</button>
  <div id="a11y-drawer" role="dialog" aria-modal="true" data-open="false" tabindex="-1">
    ${toggles}
    <button data-a11y-font="inc">A+</button>
    <button data-a11y-font="dec">A-</button>
    <button data-a11y-font="reset">A</button>
    <button data-a11y-font="huge">?</button>
    <span id="a11y-font-label"></span>
    <button id="a11y-reset-btn">Reset</button>
  </div>
  <div data-drawer-backdrop="a11y-drawer" data-open="false"></div>
`;

let releaseListeners: () => void;
const root = document.documentElement;
const toggle = (id: string) =>
  document.querySelector<HTMLInputElement>(`[data-a11y-toggle="${id}"]`) as HTMLInputElement;
const fontButton = (action: string) =>
  document.querySelector<HTMLElement>(`[data-a11y-font="${action}"]`) as HTMLElement;
const label = () => document.getElementById("a11y-font-label")?.textContent;
const stored = () => JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY) ?? "null") as unknown;

const boot = async (html = MARKUP) => {
  document.body.innerHTML = html;
  vi.resetModules();
  await import("../../../../src/scripts/chrome/a11y-preferences");
};

const flip = (id: string, checked: boolean) => {
  toggle(id).checked = checked;
  toggle(id).dispatchEvent(new Event("change"));
};

beforeEach(() => {
  releaseListeners = trackDocumentListeners();
  stubAnimationFrames();
});

afterEach(() => {
  releaseListeners();
  vi.unstubAllGlobals();
  localStorage.clear();
  A11Y_TOGGLE_IDS.forEach((id) => root.removeAttribute(`data-a11y-${id}`));
  root.style.fontSize = "";
});

describe("a11y preferences on load", () => {
  it("applies what was stored to the page and to the drawer's controls", async () => {
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify({ contrast: true, fontSize: 115 }));
    await boot();
    expect(root.getAttribute("data-a11y-contrast")).toBe("on");
    expect(root.hasAttribute("data-a11y-links")).toBe(false);
    expect(toggle("contrast").checked).toBe(true);
    expect(toggle("links").checked).toBe(false);
    expect(root.style.fontSize).toBe("115%");
    expect(label()).toBe("115%");
  });

  it("starts from the default text size with nothing stored", async () => {
    await boot();
    expect(root.style.fontSize).toBe("");
    expect(label()).toBe("100%");
  });

  it("still applies preferences on a page without the size label or reset button", async () => {
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify({ cursor: true }));
    await boot(
      MARKUP.replace('<span id="a11y-font-label"></span>', "").replace(
        '<button id="a11y-reset-btn">Reset</button>',
        ""
      )
    );
    expect(root.getAttribute("data-a11y-cursor")).toBe("on");
  });
});

describe("a11y preference changes", () => {
  it("stores and applies a switched toggle, and removes it when switched back", async () => {
    await boot();
    flip("links", true);
    expect(stored()).toEqual({ links: true });
    expect(root.getAttribute("data-a11y-links")).toBe("on");
    flip("links", false);
    expect(stored()).toEqual({ links: false });
    expect(root.hasAttribute("data-a11y-links")).toBe(false);
  });

  it("steps the text size up, down and back to the default", async () => {
    await boot();
    fontButton("inc").click();
    expect(stored()).toEqual({ fontSize: 115 });
    expect(root.style.fontSize).toBe("115%");
    fontButton("dec").click();
    fontButton("dec").click();
    expect(label()).toBe("85%");
    fontButton("reset").click();
    expect(stored()).toEqual({ fontSize: 100 });
    expect(root.style.fontSize).toBe("");
    expect(label()).toBe("100%");
  });

  it("ignores a size button with an unknown action", async () => {
    await boot();
    fontButton("huge").click();
    expect(localStorage.getItem(A11Y_STORAGE_KEY)).toBeNull();
    expect(label()).toBe("100%");
  });

  it("clears every preference from the reset button", async () => {
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify({ grayscale: true, fontSize: 130 }));
    await boot();
    document.getElementById("a11y-reset-btn")?.click();
    expect(stored()).toEqual({});
    expect(root.hasAttribute("data-a11y-grayscale")).toBe(false);
    expect(toggle("grayscale").checked).toBe(false);
    expect(root.style.fontSize).toBe("");
  });

  it("re-reads stored preferences each time the drawer opens", async () => {
    await boot();
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify({ readable: true }));
    document.getElementById("open")?.click();
    expect(toggle("readable").checked).toBe(true);
    expect(root.getAttribute("data-a11y-readable")).toBe("on");
  });
});
