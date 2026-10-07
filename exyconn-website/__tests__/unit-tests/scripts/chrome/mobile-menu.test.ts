// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubAnimationFrames, trackDocumentListeners } from "../script-dom";

const MENU = `
  <button id="open" data-drawer-open="mobileMenu">Menu</button>
  <div id="mobileMenu" role="dialog" aria-modal="true" data-open="false" tabindex="-1">
    <a id="link" href="#services">Services</a>
    <button id="search" data-search-open>Search</button>
    <button id="other">Theme</button>
  </div>
`;
const BACKDROP = '<div data-drawer-backdrop="mobileMenu" data-open="false"></div>';

let releaseListeners: () => void;
const byId = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;
const menuState = () => byId("mobileMenu").dataset.open;

const boot = async (html: string) => {
  document.body.innerHTML = html;
  vi.resetModules();
  await import("../../../../src/scripts/chrome/mobile-menu");
};

beforeEach(() => {
  releaseListeners = trackDocumentListeners();
  stubAnimationFrames();
});

afterEach(() => {
  releaseListeners();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove("chrome-locked");
});

describe("mobile menu", () => {
  it.each(["link", "search"])("closes when the %s is chosen", async (id) => {
    await boot(MENU + BACKDROP);
    byId("open").click();
    expect(menuState()).toBe("true");
    byId(id).click();
    expect(menuState()).toBe("false");
  });

  it("stays open for other controls inside it", async () => {
    await boot(MENU + BACKDROP);
    byId("open").click();
    byId("other").click();
    expect(menuState()).toBe("true");
  });

  it("ignores its links when the drawer could not be bound", async () => {
    await boot(MENU);
    expect(() => byId("link").click()).not.toThrow();
    expect(menuState()).toBe("false");
  });
});
