// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { giveElementsBoxes, trackDocumentListeners } from "./script-dom";

// A plain script with no exports is not a module to TypeScript, so it is imported by path.
const SCRIPT = "../../../src/scripts/modal-dialogs";

const MARKUP = `
  <button id="outside">Outside</button>
  <div id="menu" aria-modal="true" data-open="false" tabindex="-1">
    <a id="first" href="#a">First</a>
    <button id="middle">Middle</button>
    <button id="last">Last</button>
    <button id="no-box" data-no-box>Not shown</button>
    <button disabled>Disabled</button>
  </div>
  <div id="empty" aria-modal="true" data-open="false" tabindex="-1"><p>Nothing to focus</p></div>
`;

let releaseListeners: () => void;
const byId = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const pressTab = (shiftKey = false, key = "Tab"): KeyboardEvent => {
  const event = new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true });
  (document.activeElement ?? document.body).dispatchEvent(event);
  return event;
};

const openDialog = async (id: string) => {
  byId(id).dataset.open = "true";
  await settle();
};

beforeEach(async () => {
  releaseListeners = trackDocumentListeners();
  giveElementsBoxes();
  document.body.innerHTML = MARKUP;
  vi.resetModules();
  await import(SCRIPT);
});

afterEach(() => {
  releaseListeners();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("modal inertness", () => {
  it("makes a closed modal inert and lifts it while the modal is open", async () => {
    expect(byId("menu").inert).toBe(true);
    await openDialog("menu");
    expect(byId("menu").inert).toBe(false);
    byId("menu").dataset.open = "false";
    await settle();
    expect(byId("menu").inert).toBe(true);
  });
});

describe("tab containment", () => {
  it("wraps Tab from the last shown control back to the first", async () => {
    await openDialog("menu");
    byId("last").focus();
    const event = pressTab();
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(byId("first"));
  });

  it("wraps Shift+Tab from the first control to the last shown one", async () => {
    await openDialog("menu");
    byId("first").focus();
    const event = pressTab(true);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(byId("last"));
  });

  it("pulls focus that is behind the backdrop into the modal", async () => {
    await openDialog("menu");
    byId("outside").focus();
    expect(pressTab().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(byId("first"));
    byId("outside").focus();
    expect(pressTab(true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(byId("last"));
  });

  it("leaves Tab alone between the ends", async () => {
    await openDialog("menu");
    byId("middle").focus();
    expect(pressTab().defaultPrevented).toBe(false);
    expect(pressTab(true).defaultPrevented).toBe(false);
    byId("first").focus();
    expect(pressTab().defaultPrevented).toBe(false);
    byId("last").focus();
    expect(pressTab(true).defaultPrevented).toBe(false);
  });

  it("ignores other keys and pages with no open modal", async () => {
    byId("outside").focus();
    expect(pressTab().defaultPrevented).toBe(false);
    await openDialog("menu");
    byId("last").focus();
    expect(pressTab(false, "Enter").defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(byId("last"));
  });

  it("holds focus on a modal that has nothing focusable", async () => {
    await openDialog("empty");
    byId("outside").focus();
    expect(pressTab().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(byId("empty"));
  });

  it("traps inside the modal opened last when two are open", async () => {
    await openDialog("menu");
    await openDialog("empty");
    byId("first").focus();
    pressTab();
    expect(document.activeElement).toBe(byId("empty"));
  });
});
