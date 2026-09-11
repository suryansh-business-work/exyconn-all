import { HUES, ramp, type Hue } from "./palette.tokens";

/**
 * The roles a component may paint with, each answered once for daylight and once for
 * night. Declaring both answers side by side is what keeps the modes in step: a role
 * cannot exist in one and be forgotten in the other.
 *
 * Every role becomes a `--color-{role}` custom property and a Tailwind colour of the same
 * name, so `bg-surface`, `text-fg-muted` and `var(--color-line)` all read one value.
 *
 * Fills that carry white text (`blue`, `blue-strong`, `inverse`) keep their daylight value
 * at night, so the text on them stays readable; tints and inks are what change.
 */
type Pair = readonly [light: string, dark: string];

/** A night wash: the hue thinned into the night page, so a tile reads tinted, not lit. */
const nightTint = (hue: Hue, percent: number): string =>
  `color-mix(in oklab, ${ramp(hue, 500)} ${percent}%, ${ramp("ink", 900)})`;

/** The brand blue thinned towards transparent, for rings and glows over any surface. */
const brandTint = (percent: number): string =>
  `color-mix(in srgb, ${ramp("brand", 500)} ${percent}%, transparent)`;

const same = (value: string): Pair => [value, value];

/** `var(--color-surface)` — how TypeScript (inline styles, the Tailwind plugin) names a role. */
export const roleVar = (role: string): string => `var(--color-${role})`;

const neutralRoles = {
  /* Surfaces, from the page up. `subtle` is the alternate section band. */
  page: [ramp("base", "white"), ramp("ink", 900)],
  surface: [ramp("base", "white"), ramp("ink", 800)],
  "surface-subtle": [ramp("gray", 50), ramp("ink", 900)],
  "surface-muted": [ramp("gray", 100), ramp("ink", 700)],
  "surface-strong": [ramp("gray", 200), ramp("ink", 600)],
  /* The dark band — footer, closing CTA. Dark in both modes, a step below the night page. */
  inverse: [ramp("gray", 900), ramp("ink", 950)],
  "inverse-muted": [ramp("gray", 800), ramp("ink", 800)],

  /* Inks, strongest first. Contrast is measured against `surface` in each mode. */
  fg: [ramp("gray", 900), ramp("gray", 50)],
  "fg-secondary": [ramp("gray", 700), ramp("gray", 200)],
  "fg-muted": [ramp("gray", 600), ramp("gray", 300)],
  "fg-subtle": [ramp("gray", 500), ramp("gray", 400)],
  "fg-faint": [ramp("gray", 400), ramp("gray", 500)],

  /* Lines */
  "line-subtle": [ramp("gray", 100), ramp("ink", 700)],
  line: [ramp("gray", 200), ramp("ink", 600)],
  "line-strong": [ramp("gray", 300), ramp("gray", 600)],

  /* Ink on a saturated or dark fill — the same white whichever mode the page is in. */
  "on-solid": same(ramp("base", "white")),
  "on-solid-muted": same(`color-mix(in srgb, ${ramp("base", "white")} 75%, transparent)`),
  /* Dims whatever is behind it: a modal backdrop, a caption bar over a photograph. */
  scrim: same(ramp("base", "black")),
} satisfies Record<string, Pair>;

/**
 * The Exyconn blue and the form controls built on it. `primary` steps up to brand 300 at
 * night because the daylight blue reaches only 3.9:1 on the night page. A night button is
 * neutral until you reach it: a wall of saturated blue on near-black is what makes a dark
 * theme look like a light one with the lights off.
 */
const brandRoles = {
  primary: [ramp("brand", 500), ramp("brand", 300)],
  "primary-hover": [ramp("brand", 600), ramp("sky", 300)],
  "on-primary": [ramp("base", "white"), ramp("ink", 900)],
  "primary-faint": same(brandTint(4)),
  "primary-subtle": same(brandTint(12.5)),
  "primary-soft": same(brandTint(25)),
  "focus-ring": [ramp("brand", 500), ramp("brand", 300)],

  "field-bg": [ramp("base", "white"), ramp("ink", 800)],
  "field-bg-focus": [ramp("sky", 50), ramp("ink", 700)],
  "field-ring": [roleVar("primary-subtle"), roleVar("primary-soft")],
  "fg-placeholder": [ramp("gray", 400), ramp("gray", 500)],
  "button-bg": [ramp("brand", 500), ramp("ink", 700)],
  "button-fg": [ramp("base", "white"), ramp("gray", 100)],
  "surface-disabled": [ramp("slate", 300), ramp("gray", 700)],
  "fg-disabled": same(ramp("gray", 500)),
} satisfies Record<string, Pair>;

/**
 * Eleven roles per hue, named for what they are used as rather than for a shade:
 * `subtle`/`soft`/`muted` are tinted backgrounds and borders; the bare hue and its
 * `strong`/`deep`/`night` steps are solid fills and gradient stops (`night` is dark enough
 * to be a band behind white text); `fg`/`fg-strong`/`fg-deep` are the hue as text on a
 * page surface, darkest last; and `bright` is the hue as text on a dark band.
 */
const hueRoles = (hue: Hue): Record<string, Pair> => ({
  [`${hue}-subtle`]: [ramp(hue, 50), nightTint(hue, 10)],
  [`${hue}-soft`]: [ramp(hue, 100), nightTint(hue, 18)],
  [`${hue}-muted`]: [ramp(hue, 200), nightTint(hue, 30)],
  [hue]: same(ramp(hue, 500)),
  [`${hue}-strong`]: same(ramp(hue, 600)),
  [`${hue}-deep`]: same(ramp(hue, 700)),
  [`${hue}-night`]: same(ramp(hue, 950)),
  [`${hue}-bright`]: same(ramp(hue, 400)),
  [`${hue}-fg`]: [ramp(hue, 600), ramp(hue, 400)],
  [`${hue}-fg-strong`]: [ramp(hue, 700), ramp(hue, 300)],
  [`${hue}-fg-deep`]: [ramp(hue, 900), ramp(hue, 200)],
});

export const roles: Readonly<Record<string, Pair>> = {
  ...neutralRoles,
  ...brandRoles,
  ...Object.assign({}, ...HUES.map(hueRoles)),
};

export const lightRoles: Record<string, string> = Object.fromEntries(
  Object.entries(roles).map(([role, [light]]) => [role, light])
);

/** Only the roles whose night answer differs — the rest inherit from `:root`. */
export const darkRoles: Record<string, string> = Object.fromEntries(
  Object.entries(roles)
    .filter(([, [light, dark]]) => light !== dark)
    .map(([role, [, dark]]) => [role, dark])
);

/**
 * High contrast is not a third mode: the same daylight roles, answered by darker ramp
 * entries for a visitor whose OS says the defaults are not enough.
 */
export const highContrastRoles: Record<string, string> = {
  primary: ramp("brand", 600),
  "fg-muted": ramp("gray", 700),
};
