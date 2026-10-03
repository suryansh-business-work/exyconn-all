import { tabForKey } from "../../lib/detail/helpers";

/**
 * Turns DetailTabs' stacked panels into tabs: reveals the tab list and the pagers, shows one
 * panel at a time, and follows the WAI-ARIA tabs pattern (roving tabindex, arrow keys, Home,
 * End). Without this script every panel stays visible.
 */
const wire = (root: HTMLElement) => {
  const list = root.querySelector<HTMLElement>('[role="tablist"]');
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
  if (!list || tabs.length === 0 || tabs.length !== panels.length) {
    return;
  }

  const select = (index: number, focus: boolean) => {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
    const tab = tabs[index];
    list.scrollTo({ left: tab.offsetLeft - list.clientWidth / 2 + tab.clientWidth / 2 });
    if (focus) {
      tab.focus({ preventScroll: true });
    }
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i, false));
    tab.addEventListener("keydown", (event) => {
      const next = tabForKey(event.key, i, tabs.length);
      if (next !== undefined) {
        event.preventDefault();
        select(next, true);
      }
    });
  });

  panels.forEach((panel, i) => {
    panel.querySelectorAll<HTMLButtonElement>("[data-tab-step]").forEach((button) => {
      button.addEventListener("click", () => {
        select(i + Number(button.dataset.tabStep), true);
      });
    });
    panel.querySelector<HTMLElement>(".detail-tabs__pager")?.removeAttribute("hidden");
  });

  list.hidden = false;
  root.dataset.tabsReady = "";
  select(0, false);
};

export const bootDetailTabs = () => {
  document.querySelectorAll<HTMLElement>("[data-detail-tabs]").forEach(wire);
};
