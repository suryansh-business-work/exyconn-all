/**
 * The accessibility drawer. Page.astro's head script applies stored preferences before the
 * first paint; this keeps the drawer's controls in step and applies every change.
 */
import {
  A11Y_STORAGE_KEY,
  A11Y_TOGGLE_IDS,
  DEFAULT_FONT,
  isFontAction,
  nextFontSize,
  parseA11yPreferences,
  type A11yPreferences,
} from "../../lib/chrome/preferences";
import { bindDrawer } from "./drawer";
import { readStored, writeStored } from "./storage";

const root = document.documentElement;
const load = (): A11yPreferences => parseA11yPreferences(readStored(A11Y_STORAGE_KEY));

const toggleInput = (id: string): HTMLInputElement | null =>
  document.querySelector<HTMLInputElement>(`[data-a11y-toggle="${id}"]`);

function apply(preferences: A11yPreferences): void {
  for (const id of A11Y_TOGGLE_IDS) {
    if (preferences[id]) {
      root.setAttribute(`data-a11y-${id}`, "on");
    } else {
      root.removeAttribute(`data-a11y-${id}`);
    }
    const input = toggleInput(id);
    if (input) {
      input.checked = Boolean(preferences[id]);
    }
  }
  const font = preferences.fontSize ?? DEFAULT_FONT;
  root.style.fontSize = font === DEFAULT_FONT ? "" : `${font}%`;
  const label = document.getElementById("a11y-font-label");
  if (label) {
    label.textContent = `${font}%`;
  }
}

function update(change: (preferences: A11yPreferences) => A11yPreferences): void {
  const next = change(load());
  writeStored(A11Y_STORAGE_KEY, JSON.stringify(next));
  apply(next);
}

bindDrawer("a11y-drawer", () => apply(load()));
apply(load());

for (const id of A11Y_TOGGLE_IDS) {
  const input = toggleInput(id);
  input?.addEventListener("change", () => {
    update((preferences) => ({ ...preferences, [id]: input.checked }));
  });
}

for (const button of document.querySelectorAll<HTMLElement>("[data-a11y-font]")) {
  button.addEventListener("click", () => {
    const action = button.dataset.a11yFont;
    if (isFontAction(action)) {
      update((preferences) => ({
        ...preferences,
        fontSize: nextFontSize(preferences.fontSize, action),
      }));
    }
  });
}

document.getElementById("a11y-reset-btn")?.addEventListener("click", () => {
  update(() => ({}));
});
