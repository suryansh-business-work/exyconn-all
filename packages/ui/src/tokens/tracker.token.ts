import { amber, emerald, neutral, red, slate } from './colors.tokens';
import { selectedInk } from './selection.token';

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
export const trackerSelected = selectedInk;
