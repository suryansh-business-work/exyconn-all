// @vitest-environment jsdom
/** DetailTabs' stacked panels turned into WAI-ARIA tabs. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootDetailTabs } from "../../../../src/components/detail/tabs";

const PAGER = `<div class="detail-tabs__pager" hidden>
  <button data-tab-step="-1">Previous</button><button data-tab-step="1">Next</button>
</div>`;

function mountTabs(count: number, panelCount = count, pager = PAGER): HTMLElement {
  const tabs = Array.from(
    { length: count },
    (_, i) => `<button role="tab" id="tab-${i}">Tab ${i}</button>`
  ).join("");
  const panels = Array.from(
    { length: panelCount },
    (_, i) => `<section role="tabpanel" id="panel-${i}">Panel ${i}${pager}</section>`
  ).join("");
  document.body.innerHTML = `<div data-detail-tabs>
    <div role="tablist" hidden>${tabs}</div>${panels}
  </div>`;
  return document.querySelector<HTMLElement>("[data-detail-tabs]") as HTMLElement;
}

const tab = (i: number) => document.getElementById(`tab-${i}`) as HTMLButtonElement;
const panel = (i: number) => document.getElementById(`panel-${i}`) as HTMLElement;
const visiblePanels = () =>
  [...document.querySelectorAll<HTMLElement>('[role="tabpanel"]')]
    .filter((element) => !element.hidden)
    .map((element) => element.id);

function press(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  // jsdom has no layout, so it has no scrolling either.
  Element.prototype.scrollTo = vi.fn();
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("bootDetailTabs", () => {
  it("reveals the tab list and pagers and shows the first panel only", () => {
    const root = mountTabs(3);
    bootDetailTabs();
    expect(root.dataset.tabsReady).toBe("");
    expect(document.querySelector<HTMLElement>('[role="tablist"]')?.hidden).toBe(false);
    expect(document.querySelectorAll(".detail-tabs__pager[hidden]")).toHaveLength(0);
    expect(visiblePanels()).toEqual(["panel-0"]);
    expect(tab(0).getAttribute("aria-selected")).toBe("true");
    expect([tab(0).tabIndex, tab(1).tabIndex, tab(2).tabIndex]).toEqual([0, -1, -1]);
  });

  it("switches panels on click without moving focus", () => {
    mountTabs(3);
    bootDetailTabs();
    tab(2).click();
    expect(visiblePanels()).toEqual(["panel-2"]);
    expect(tab(2).getAttribute("aria-selected")).toBe("true");
    expect(tab(0).getAttribute("aria-selected")).toBe("false");
    expect(document.activeElement).not.toBe(tab(2));
  });

  it("follows the arrow, Home and End keys and moves focus with them", () => {
    mountTabs(3);
    bootDetailTabs();
    const event = press(tab(0), "ArrowLeft");
    expect(event.defaultPrevented).toBe(true);
    expect(visiblePanels()).toEqual(["panel-2"]);
    expect(document.activeElement).toBe(tab(2));
    press(tab(2), "Home");
    expect(visiblePanels()).toEqual(["panel-0"]);
    press(tab(0), "End");
    expect(document.activeElement).toBe(tab(2));
  });

  it("leaves other keys alone", () => {
    mountTabs(2);
    bootDetailTabs();
    const event = press(tab(0), "Enter");
    expect(event.defaultPrevented).toBe(false);
    expect(visiblePanels()).toEqual(["panel-0"]);
  });

  it("pages to the next and previous panel from inside a panel", () => {
    mountTabs(3);
    bootDetailTabs();
    panel(0).querySelector<HTMLButtonElement>('[data-tab-step="1"]')?.click();
    expect(visiblePanels()).toEqual(["panel-1"]);
    expect(document.activeElement).toBe(tab(1));
    panel(1).querySelector<HTMLButtonElement>('[data-tab-step="-1"]')?.click();
    expect(visiblePanels()).toEqual(["panel-0"]);
  });

  it("works for panels without a pager", () => {
    mountTabs(2, 2, "");
    bootDetailTabs();
    expect(visiblePanels()).toEqual(["panel-0"]);
    tab(1).click();
    expect(visiblePanels()).toEqual(["panel-1"]);
  });

  it("centres the selected tab in the list", () => {
    mountTabs(2);
    bootDetailTabs();
    expect(Element.prototype.scrollTo).toHaveBeenCalledWith({ left: 0 });
  });

  it("leaves the stacked panels alone when the markup does not match", () => {
    mountTabs(2, 3);
    bootDetailTabs();
    expect(visiblePanels()).toEqual(["panel-0", "panel-1", "panel-2"]);
    expect(document.querySelector<HTMLElement>('[role="tablist"]')?.hidden).toBe(true);

    document.body.innerHTML = `<div data-detail-tabs><div role="tablist" hidden></div></div>`;
    bootDetailTabs();
    expect(document.querySelector<HTMLElement>("[data-detail-tabs]")?.dataset.tabsReady).toBe(
      undefined
    );

    document.body.innerHTML = `<div data-detail-tabs><section role="tabpanel"></section></div>`;
    bootDetailTabs();
    expect(document.querySelector<HTMLElement>('[role="tabpanel"]')?.hidden).toBe(false);
  });
});
