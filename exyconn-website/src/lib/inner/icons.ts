/**
 * The site's own icon set: 24×24 outline glyphs drawn with `currentColor` (after Lucide, ISC
 * licence). Inline SVG instead of the Font Awesome webfont, so an icon never renders blank
 * while the font loads, or at all when a Pro-only glyph name was used.
 *
 * Every entry is a list of path `d` strings. `Icon.astro` (Astro) and `SvgIcon.tsx` (React)
 * render them; nothing else should hold path data.
 */
export const ICONS = {
  "arrow-right": ["M5 12h14", "m12 5 7 7-7 7"],
  "arrow-up": ["m5 12 7-7 7 7", "M12 19V5"],
  "arrow-up-right": ["M7 7h10v10", "M7 17 17 7"],
  "chevron-down": ["m6 9 6 6 6-6"],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  close: ["M18 6 6 18", "m6 6 12 12"],
  search: ["M11 3a8 8 0 1 0 0 16 8 8 0 1 0 0-16Z", "m21 21-4.3-4.3"],
  sun: [
    "M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8Z",
    "M12 2v2",
    "M12 20v2",
    "m4.93 4.93 1.41 1.41",
    "m17.66 17.66 1.41 1.41",
    "M2 12h2",
    "M20 12h2",
    "m6.34 17.66-1.41 1.41",
    "m19.07 4.93-1.41 1.41",
  ],
  moon: ["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"],
  accessibility: [
    "M12 4a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z",
    "m9 20 3-6 3 6",
    "m6 8 6 2 6-2",
    "M12 10v4",
  ],
  cookie: [
    "M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5",
    "M8.5 8.5v.01",
    "M16 15.5v.01",
    "M12 12v.01",
    "M11 17v.01",
    "M7 14v.01",
  ],
  "check-circle": ["M22 11.08V12a10 10 0 1 1-5.93-9.14", "m9 11 3 3L22 4"],
  "alert-circle": ["M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20Z", "M12 8v4", "M12 16h.01"],
  spinner: ["M21 12a9 9 0 1 1-6.219-8.56"],
  send: ["m22 2-7 20-4-9-9-4Z", "M22 2 11 13"],
  refresh: [
    "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
    "M3 3v5h5",
    "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16",
    "M16 16h5v5",
  ],
  reset: ["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5"],
  shield: [
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  ],
  globe: [
    "M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20Z",
    "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",
    "M2 12h20",
  ],
  mail: [
    "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    "m22 6-10 7L2 6",
  ],
  minus: ["M5 12h14"],
  plus: ["M5 12h14", "M12 5v14"],
  calendar: [
    "M8 2v4",
    "M16 2v4",
    "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    "M3 10h18",
  ],
} as const satisfies Record<string, readonly string[]>;

export type IconName = keyof typeof ICONS;

/** The path list for one icon. */
export const iconPaths = (name: IconName): readonly string[] => ICONS[name];
