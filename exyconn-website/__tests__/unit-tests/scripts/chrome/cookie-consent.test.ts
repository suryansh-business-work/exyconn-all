// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONSENT_STORAGE_KEY,
  COOKIE_PREFS_STORAGE_KEY,
} from "../../../../src/lib/chrome/preferences";
import { stubAnimationFrames, trackDocumentListeners } from "../script-dom";

const BUTTONS = `
  <button id="cookie-accept">Accept all</button>
  <button id="cookie-reject">Reject all</button>
  <button id="cookie-save-preferences">Save</button>
`;
const MARKUP = `
  <button id="cookie-prefs" data-drawer-open="cookie-drawer">Cookie preferences</button>
  <div id="cookie-drawer" role="dialog" aria-modal="true" data-open="false" tabindex="-1">
    <input type="checkbox" data-cookie-category="analytics" />
    <input type="checkbox" data-cookie-category="functional" />
    <input type="checkbox" data-cookie-category="marketing" />
    ${BUTTONS}
  </div>
  <div data-drawer-backdrop="cookie-drawer" data-open="false"></div>
`;

let releaseListeners: () => void;
const drawerOpen = () => document.getElementById("cookie-drawer")?.dataset.open;
const box = (id: string) =>
  document.querySelector<HTMLInputElement>(`[data-cookie-category="${id}"]`) as HTMLInputElement;
const click = (id: string) => document.getElementById(id)?.click();
const storedPreferences = () =>
  JSON.parse(localStorage.getItem(COOKIE_PREFS_STORAGE_KEY) ?? "null") as unknown;

const boot = async (html = MARKUP) => {
  document.body.innerHTML = html;
  vi.resetModules();
  await import("../../../../src/scripts/chrome/cookie-consent");
};

beforeEach(() => {
  releaseListeners = trackDocumentListeners();
  stubAnimationFrames();
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  releaseListeners();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.classList.remove("chrome-locked");
});

describe("cookie drawer on load", () => {
  it("opens by itself shortly after a first visit", async () => {
    await boot();
    vi.advanceTimersByTime(599);
    expect(drawerOpen()).toBe("false");
    vi.advanceTimersByTime(1);
    expect(drawerOpen()).toBe("true");
  });

  it("stays closed for a visitor who already chose", async () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "rejected");
    await boot();
    expect(vi.getTimerCount()).toBe(0);
    expect(drawerOpen()).toBe("false");
  });
});

describe("cookie choices", () => {
  beforeEach(() => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "custom");
  });

  it("accepts every category and closes", async () => {
    await boot();
    click("cookie-prefs");
    click("cookie-accept");
    expect(storedPreferences()).toEqual({ analytics: true, functional: true, marketing: true });
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("accepted");
    expect(box("marketing").checked).toBe(true);
    expect(drawerOpen()).toBe("false");
  });

  it("rejects every category", async () => {
    await boot();
    box("analytics").checked = true;
    click("cookie-reject");
    expect(storedPreferences()).toEqual({ analytics: false, functional: false, marketing: false });
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("rejected");
    expect(box("analytics").checked).toBe(false);
  });

  it("saves exactly the boxes the visitor ticked", async () => {
    await boot();
    box("analytics").checked = true;
    click("cookie-save-preferences");
    expect(storedPreferences()).toEqual({ analytics: true, functional: false, marketing: false });
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("custom");
  });

  it("shows the stored choice when opened, skipping values that are not booleans", async () => {
    localStorage.setItem(
      COOKIE_PREFS_STORAGE_KEY,
      JSON.stringify({ analytics: false, functional: "yes", marketing: true })
    );
    await boot();
    box("analytics").checked = true;
    box("functional").checked = true;
    click("cookie-prefs");
    expect(box("analytics").checked).toBe(false);
    expect(box("functional").checked).toBe(true);
    expect(box("marketing").checked).toBe(true);
  });

  it.each(["{not json", "null", "5"])("treats a stored %s as no choice", async (raw) => {
    localStorage.setItem(COOKIE_PREFS_STORAGE_KEY, raw);
    await boot();
    box("marketing").checked = true;
    click("cookie-prefs");
    expect(drawerOpen()).toBe("true");
    expect(box("marketing").checked).toBe(true);
  });

  it("still records a choice on a page without the drawer", async () => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    await boot(BUTTONS);
    expect(vi.getTimerCount()).toBe(0);
    click("cookie-save-preferences");
    expect(storedPreferences()).toEqual({ analytics: false, functional: false, marketing: false });
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("custom");
  });
});
