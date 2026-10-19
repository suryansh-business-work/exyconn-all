/**
 * Borders and corners.
 *
 * Elevation in this system is carried by a hairline border, not by a shadow — see
 * `box-shadow.token.ts`. That makes `borderWidth.hairline` the single most-used token here.
 */
export const borderWidth = { none: 0, hairline: 1, thick: 2, accent: 3 } as const;

export type BorderWidth = keyof typeof borderWidth;

/**
 * Raw px corner radii, for plain style props (e.g. `style={{ borderRadius: radius.sm }}`).
 *
 * NOT for MUI's `sx` `borderRadius`, which is a `theme.shape.borderRadius` MULTIPLIER — a
 * different unit system. In `sx`, write `borderRadius: 1` (one theme radius) or a string
 * like `'4px'` if you truly mean px.
 */
export const radius = {
  sm: 4,
  md: 8,
  /** A field's corner: soft, but square enough that a column of them still reads as a form. */
  control: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  /** The frosted frame the portal's page sits in — the largest corner in the system. */
  frame: 28,
  pill: 9999,
} as const;

export type Radius = keyof typeof radius;

/**
 * The portals' control corner, in px — the theme's `shape.borderRadius`, so `sx={{
 * borderRadius: 1 }}` is one control corner: text fields, selects and tiles. Buttons, chips,
 * tabs and navigation rows go further, to a pill; icon buttons and avatars are circles.
 */
export const BASE_RADIUS = radius.control;

/** The portals' card corner: cards, panels and grids — soft, as frosted glass is. */
export const CARD_RADIUS = radius.xl;

/** The portals' floating corner: menus, popovers, the autocomplete list and alerts. */
export const FLOATING_RADIUS = radius.lg;

/** A dialog's corner: a card, a step larger because it floats above everything. */
export const DIALOG_RADIUS = radius.xxl;

/** The frame round the page content on a desk-sized screen. */
export const FRAME_RADIUS = radius.frame;

/**
 * The trackers' (desktop and phone) control corner — inputs, tiles, calendar days. The 2026-09
 * redesign traded the old 4px ceiling for soft cards and pill controls.
 */
export const TRACKER_RADIUS = radius.lg;

/** The trackers' card corner: every panel on the page. */
export const TRACKER_CARD_RADIUS = 24;
