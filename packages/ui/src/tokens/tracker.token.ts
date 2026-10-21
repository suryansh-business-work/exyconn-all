import { amber, azure, blue, emerald, neutral, orange, red, slate, violet } from './colors.tokens';

/**
 * The trackers' (desktop and phone) own colour roles. Named for what they mean, and kept here
 * because the phone reaches the ramps by path, so both apps read one set of values.
 */

/**
 * An activity level's hue, per mode: the stripes, the calendar dots and the legend. Deeper on
 * the light ground and lighter on the dark one, so a bar keeps its contrast on either.
 */
export const trackerActivity = {
  light: { low: red[400], medium: amber[500], high: emerald[600] },
  dark: { low: red[300], medium: amber[300], high: emerald[300] },
} as const;

/** The day's progress bar, coral through amber to green as the day fills. */
export const trackerProgressGradient = [red[300], amber[300], emerald[400]] as const;

/** The floating tab bar: dark on either palette, a step lighter on the dark one to lift off it. */
export const trackerTabBar = { light: slate[950], dark: neutral[700] } as const;

/** A selected tab, segment, chip or calendar day — the design system's own selection ink. */
export { selectedInk as trackerSelected } from './selection.token';

/**
 * A calendar day's status hue, per mode — the tile's border, icon and tint on the portal, the
 * desktop and the phone alike. Keyed by tracker-core's `DayMark`. The light shades are each
 * mode's status inks (3:1 and better on the surface); the dark ones lift for the dark ground.
 */
export const trackerDayStatus = {
  light: {
    COMPLETED: emerald[900],
    SHORT: red[950],
    LEAVE: blue[700],
    HOLIDAY: violet[500],
    WEEK_OFF: neutral[500],
    OFF_COMPUTER: orange[800],
  },
  dark: {
    COMPLETED: emerald[300],
    SHORT: red[300],
    LEAVE: azure[300],
    HOLIDAY: violet[300],
    WEEK_OFF: neutral[300],
    OFF_COMPUTER: amber[300],
  },
} as const;

/** A status hue's tile tint: the hue at about 12%, so text on it keeps the page's contrast. */
export const TRACKER_STATUS_TINT_ALPHA = '1f';
