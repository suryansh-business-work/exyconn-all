// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackDocumentListeners } from "../script-dom";

// A plain script with no exports is not a module to TypeScript, so it is imported by path.
const SCRIPT = "../../../../src/scripts/chrome/header-menus";

const menu = (n: number, label: string) => `
  <div data-nav-menu id="wrapper-${n}">
    <button id="button-${n}" aria-controls="panel-${n}" aria-expanded="false">${label}</button>
    <div id="panel-${n}" hidden><a id="link-${n}" href="#${label}">${label} overview</a></div>
  </div>`;

const MARKUP = `
  <nav>
    ${menu(1, "services")}
    ${menu(2, "company")}
    <div data-nav-menu><button id="broken" aria-controls="missing">Broken</button></div>
    <div data-nav-menu><span>No button</span></div>
  </nav>
  <button id="elsewhere">Elsewhere</button>
`;

let releaseListeners: () => void;
const byId = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;
const isOpen = (n: number) =>
  !byId(`panel-${n}`).hidden && byId(`button-${n}`).getAttribute("aria-expanded") === "true";

const key = (target: HTMLElement, name: string) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true }));
const focusOut = (from: HTMLElement, to: EventTarget | null) =>
  from.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: to }));

beforeEach(async () => {
  releaseListeners = trackDocumentListeners();
  document.body.innerHTML = MARKUP;
  vi.resetModules();
  await import(SCRIPT);
});

afterEach(() => {
  releaseListeners();
  document.body.innerHTML = "";
});

describe("header dropdowns", () => {
  it("opens one dropdown at a time and closes it on a second click", () => {
    byId("button-1").click();
    expect(isOpen(1)).toBe(true);
    byId("button-2").click();
    expect(isOpen(1)).toBe(false);
    expect(isOpen(2)).toBe(true);
    byId("button-2").click();
    expect(isOpen(2)).toBe(false);
    expect(byId("button-2").getAttribute("aria-expanded")).toBe("false");
  });

  it("closes on Escape and puts focus back on its button", () => {
    byId("button-1").click();
    byId("link-1").focus();
    key(byId("link-1"), "Enter");
    expect(isOpen(1)).toBe(true);
    key(byId("link-1"), "Escape");
    expect(isOpen(1)).toBe(false);
    expect(document.activeElement).toBe(byId("button-1"));
  });

  it("leaves focus alone on Escape while closed", () => {
    byId("link-1").focus();
    key(byId("link-1"), "Escape");
    expect(document.activeElement).toBe(byId("link-1"));
  });

  it("closes when focus tabs out of the dropdown, not when it moves within", () => {
    byId("button-1").click();
    focusOut(byId("button-1"), byId("link-1"));
    expect(isOpen(1)).toBe(true);
    focusOut(byId("link-1"), null);
    expect(isOpen(1)).toBe(true);
    focusOut(byId("link-1"), byId("elsewhere"));
    expect(isOpen(1)).toBe(false);
  });

  it("closes on a click elsewhere but not on a click inside its panel", () => {
    byId("button-1").click();
    byId("link-1").click();
    expect(isOpen(1)).toBe(true);
    byId("elsewhere").click();
    expect(isOpen(1)).toBe(false);
    document.dispatchEvent(new MouseEvent("click"));
    expect(isOpen(1)).toBe(false);
  });

  it("skips menus without a button or panel", () => {
    byId("broken").click();
    expect(byId("broken").hasAttribute("aria-expanded")).toBe(false);
  });
});
