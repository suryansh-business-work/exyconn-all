/**
 * The visitor's display and cookie preferences: what the accessibility and cookie drawers
 * offer, and the pure rules behind them. The drawers' scripts only read and write these.
 */

/** localStorage keys; `cookieConsent` is also what scripts/a11y-audit seeds. */
export const A11Y_STORAGE_KEY = "a11yPreferences";
export const CONSENT_STORAGE_KEY = "cookieConsent";
export const COOKIE_PREFS_STORAGE_KEY = "cookiePreferences";

export const A11Y_TOGGLES = [
  { id: "contrast", label: "High contrast", text: "Boost contrast for readability" },
  { id: "grayscale", label: "Grayscale", text: "Remove colours" },
  { id: "links", label: "Highlight links", text: "Underline every link" },
  { id: "readable", label: "Readable font", text: "A plainer, wider typeface" },
  { id: "motion", label: "Pause animations", text: "Reduce motion site-wide" },
  { id: "cursor", label: "Larger cursor", text: "Easier pointer tracking" },
] as const;

export type A11yToggle = (typeof A11Y_TOGGLES)[number]["id"];

export const A11Y_TOGGLE_IDS: readonly A11yToggle[] = A11Y_TOGGLES.map((toggle) => toggle.id);

/** Text size steps, in percent of the browser default. */
export const FONT_STEPS = [85, 100, 115, 130, 150] as const;
export const DEFAULT_FONT = 100;

export type A11yPreferences = Partial<Record<A11yToggle, boolean>> & { fontSize?: number };

export type FontAction = "inc" | "dec" | "reset";

/** The next text size for a button press; an unknown current size counts as the default. */
export function nextFontSize(current: number | undefined, action: FontAction): number {
  const steps: readonly (number | undefined)[] = FONT_STEPS;
  const found = steps.indexOf(current);
  const index = found === -1 ? FONT_STEPS.indexOf(DEFAULT_FONT) : found;
  if (action === "inc") {
    return FONT_STEPS[Math.min(FONT_STEPS.length - 1, index + 1)];
  }
  if (action === "dec") {
    return FONT_STEPS[Math.max(0, index - 1)];
  }
  return DEFAULT_FONT;
}

export const isFontAction = (value: unknown): value is FontAction =>
  value === "inc" || value === "dec" || value === "reset";

/** Stored JSON back into preferences; anything unreadable is "no preferences". */
export function parseA11yPreferences(raw: string | null): A11yPreferences {
  if (!raw) {
    return {};
  }
  try {
    const value: unknown = JSON.parse(raw);
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export const COOKIE_CATEGORIES = [
  {
    id: "analytics",
    label: "Analytics",
    text: "Help us understand how visitors use the site.",
    initial: true,
  },
  {
    id: "functional",
    label: "Functional",
    text: "Personalised features and saved preferences.",
    initial: true,
  },
  {
    id: "marketing",
    label: "Marketing",
    text: "Personalised ads and campaign measurement.",
    initial: false,
  },
] as const;

export type CookieCategory = (typeof COOKIE_CATEGORIES)[number]["id"];
export type CookiePreferences = Record<CookieCategory, boolean>;

/** Every optional category set to one value — "Accept all" and "Reject all". */
export const allCookies = (value: boolean): CookiePreferences => ({
  analytics: value,
  functional: value,
  marketing: value,
});

/**
 * Back to top shows while the reader heads back up a long page, and hides while they read
 * down it — so it never parks over the text being read.
 */
export function backToTopVisible(previousY: number, y: number, viewportHeight: number): boolean {
  return y > viewportHeight && y < previousY;
}
