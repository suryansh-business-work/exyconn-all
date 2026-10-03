/**
 * The cookie drawer: opens by itself on a first visit, from the footer's "Cookie preferences"
 * button and the phone menu at any time, and stores the choice.
 */
import {
  allCookies,
  COOKIE_CATEGORIES,
  COOKIE_PREFS_STORAGE_KEY,
  CONSENT_STORAGE_KEY,
  type CookiePreferences,
} from "../../lib/chrome/preferences";
import { bindDrawer } from "./drawer";
import { readStored, writeStored } from "./storage";

const FIRST_VISIT_DELAY_MS = 600;

const checkbox = (id: string): HTMLInputElement | null =>
  document.querySelector<HTMLInputElement>(`[data-cookie-category="${id}"]`);

function storedPreferences(): Partial<CookiePreferences> {
  try {
    const value: unknown = JSON.parse(readStored(COOKIE_PREFS_STORAGE_KEY) ?? "{}");
    return typeof value === "object" && value !== null ? value : {};
  } catch {
    return {};
  }
}

function showPreferences(preferences: Partial<CookiePreferences>): void {
  for (const category of COOKIE_CATEGORIES) {
    const box = checkbox(category.id);
    const value = preferences[category.id];
    if (box && typeof value === "boolean") {
      box.checked = value;
    }
  }
}

const chosenPreferences = (): CookiePreferences => ({
  analytics: checkbox("analytics")?.checked ?? false,
  functional: checkbox("functional")?.checked ?? false,
  marketing: checkbox("marketing")?.checked ?? false,
});

const drawer = bindDrawer("cookie-drawer", () => showPreferences(storedPreferences()));

function save(preferences: CookiePreferences, consent: string): void {
  showPreferences(preferences);
  writeStored(COOKIE_PREFS_STORAGE_KEY, JSON.stringify(preferences));
  writeStored(CONSENT_STORAGE_KEY, consent);
  drawer?.close();
}

document.getElementById("cookie-accept")?.addEventListener("click", () => {
  save(allCookies(true), "accepted");
});
document.getElementById("cookie-reject")?.addEventListener("click", () => {
  save(allCookies(false), "rejected");
});
document.getElementById("cookie-save-preferences")?.addEventListener("click", () => {
  save(chosenPreferences(), "custom");
});

if (drawer && readStored(CONSENT_STORAGE_KEY) === null) {
  setTimeout(drawer.open, FIRST_VISIT_DELAY_MS);
}
