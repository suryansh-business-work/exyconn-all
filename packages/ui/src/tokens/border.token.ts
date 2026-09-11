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
export const radius = { sm: 4, md: 8, lg: 16, pill: 9999 } as const;

export type Radius = keyof typeof radius;

/** The theme's own corner, in px. One radius everywhere: a card and a panel are one shape. */
export const BASE_RADIUS = radius.md;

/**
 * The trackers' (desktop and phone) control corner — inputs, tiles, calendar days. The 2026-09
 * redesign traded the old 4px ceiling for soft cards and pill controls.
 */
export const TRACKER_RADIUS = radius.lg;

/** The trackers' card corner: every panel on the page. */
export const TRACKER_CARD_RADIUS = 24;
