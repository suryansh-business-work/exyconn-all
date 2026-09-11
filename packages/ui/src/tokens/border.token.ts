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

/**
 * The portals' control corner, in px — the theme's `shape.borderRadius`: inputs, buttons, list
 * rows, alerts. The 2026-09 redesign followed the trackers' soft look a step less round.
 */
export const BASE_RADIUS = 10;

/** The portals' card corner: cards, panels, dialogs and grids — the trackers' 24, a step down. */
export const CARD_RADIUS = radius.lg;

/**
 * The trackers' (desktop and phone) control corner — inputs, tiles, calendar days. The 2026-09
 * redesign traded the old 4px ceiling for soft cards and pill controls.
 */
export const TRACKER_RADIUS = radius.lg;

/** The trackers' card corner: every panel on the page. */
export const TRACKER_CARD_RADIUS = 24;
