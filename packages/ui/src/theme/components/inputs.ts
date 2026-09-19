import { alpha, type CSSObject } from '../../styles';
import { tintOpacity } from '../../tokens/backgrounds.token';
import { borderWidth } from '../../tokens/border.token';
import { transition } from '../../tokens/motion.token';
import { spacing } from '../../tokens/spacing.token';
import { fontWeight } from '../../tokens/typography.token';
import {
  CONTROL_CORNER,
  DISABLED_OPACITY,
  HAIRLINE,
  HOVER_FILL_OPACITY,
  INNER_CORNER,
  PILL,
  TOUCH,
  TOUCH_TARGET,
  halo,
  type ComponentGroup,
  type ThemeParts,
} from '../parts';

/**
 * The shadcn/ui switch: a 36×20 pill with the thumb inside it. The 40×24 it replaced read as
 * a slab once a screen had a column of them. The pointer target stays 24px tall (SC 2.5.8):
 * the invisible input the click lands on reaches past the track, see `SWITCH_TARGET`.
 */
const SWITCH_WIDTH = spacing(4.5);
const SWITCH_HEIGHT = spacing(2.5);
const SWITCH_THUMB = spacing(2);
const SWITCH_INSET = (SWITCH_HEIGHT - SWITCH_THUMB) / 2;
const SWITCH_TRAVEL = SWITCH_WIDTH - SWITCH_HEIGHT;
/** The smallest pointer target WCAG 2.2 AA accepts without extra spacing (SC 2.5.8). */
const SWITCH_TARGET = spacing(3);

/** The edge MUI draws around an outlined field. */
const OUTLINE = '.MuiOutlinedInput-notchedOutline';

/** A primary button per variant, as shadcn draws its `default`, `outline` and `ghost` buttons. */
function primaryButton({ t }: ThemeParts): Record<string, CSSObject> {
  return {
    contained: {
      boxShadow: t.shadow.xs,
      '&:hover': { backgroundColor: alpha(t.primary, HOVER_FILL_OPACITY), boxShadow: t.shadow.xs },
    },
    // The outline button is neutral: foreground ink on the panel, a hairline, a muted hover.
    outlined: {
      color: t.text.primary,
      borderColor: t.divider,
      backgroundColor: t.background.panel,
      boxShadow: t.shadow.xs,
      '&:hover': { backgroundColor: t.background.muted, borderColor: t.divider },
    },
    text: { '&:hover': { backgroundColor: t.background.muted } },
  };
}

function buttons(parts: ThemeParts): ComponentGroup {
  const primary = primaryButton(parts);
  return {
    // No ripple anywhere: shadcn/ui answers a press with a colour change, and the keyboard
    // gets the `focusVisible` ring instead of the pulsing focus ripple.
    MuiButtonBase: { defaultProps: { disableRipple: true } },
    MuiButton: {
      defaultProps: { disableElevation: true, size: 'small' },
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: CONTROL_CORNER,
          fontWeight: fontWeight.medium,
          transition: transition.control,
          [TOUCH]: { minHeight: TOUCH_TARGET, paddingInline: spacing(2) },
          ...(ownerState.color === 'primary' ? primary[ownerState.variant ?? 'text'] : {}),
        }),
      },
    },
    // Icon buttons are shadcn's `ghost` + `size="icon"`: a rounded square. The hover stays
    // MUI's translucent ink wash — the muted fill on a light ground, and still visible when
    // the button floats on a photo or a dark lightbox, where a solid fill would hide the icon.
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: CONTROL_CORNER,
          transition: transition.control,
          [TOUCH]: { minWidth: TOUCH_TARGET, minHeight: TOUCH_TARGET },
        },
      },
    },
  };
}

/** Text fields and selects: shadcn's `input` — a quiet edge that turns to the ring on focus. */
function fields({ mode, t }: ThemeParts): ComponentGroup {
  // shadcn fills a dark field (`bg-input/30`); a light one is transparent on its panel.
  const fill = mode === 'dark' ? alpha(t.control, tintOpacity.strong) : 'transparent';
  return {
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: CONTROL_CORNER,
          backgroundColor: fill,
          boxShadow: t.shadow.xs,
          transition: transition.control,
          // SC 1.4.11: the outline is what shows where a field is, so it needs 3:1 against
          // the surface around it — `control` is held to that in contrast.test.ts.
          [`& ${OUTLINE}`]: { borderColor: t.control, transition: transition.control },
          [`&:hover:not(.Mui-disabled, .Mui-error, .Mui-focused) ${OUTLINE}`]: {
            borderColor: t.text.secondary,
          },
          '&.Mui-focused': { boxShadow: halo(t.ring) },
          [`&.Mui-focused ${OUTLINE}`]: {
            borderColor: t.ring,
            borderWidth: borderWidth.hairline,
          },
          [`&.Mui-error ${OUTLINE}`]: { borderColor: t.error },
          '&.Mui-error.Mui-focused': { boxShadow: halo(t.error) },
          '&.Mui-disabled': { boxShadow: 'none' },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius: CONTROL_CORNER,
          border: `${HAIRLINE} ${t.divider}`,
          boxShadow: t.shadow.md,
        },
        listbox: { padding: spacing(0.5) },
        option: { borderRadius: INNER_CORNER },
      },
    },
  };
}

function toggles({ mode, t }: ThemeParts): ComponentGroup {
  // shadcn's thumb is the page colour in light mode and the foreground in dark.
  const restingThumb = mode === 'light' ? t.background.panel : t.text.primary;
  return {
    // MUI pulls a labelled control 11px left to cancel the padding round a checkbox or switch.
    // This switch has no padding (below), so that pull slid it over whatever came before and
    // left its label touching the track. A switch's label gets a real gap instead.
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          '&:has(> .MuiSwitch-root)': { marginLeft: 0, gap: spacing(1) },
          '&.MuiFormControlLabel-labelPlacementStart:has(> .MuiSwitch-root)': {
            marginLeft: spacing(2),
            marginRight: 0,
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: SWITCH_WIDTH,
          height: SWITCH_HEIGHT,
          padding: 0,
          // The focus ring is drawn outside the track; a clipped root would cut it off.
          overflow: 'visible',
          '&.MuiSwitch-sizeSmall': { width: SWITCH_WIDTH, height: SWITCH_HEIGHT, padding: 0 },
        },
        switchBase: ({ ownerState, theme }) => {
          const accent =
            ownerState.color && ownerState.color !== 'default'
              ? theme.palette[ownerState.color]
              : theme.palette.primary;
          return {
            padding: 0,
            margin: SWITCH_INSET,
            color: restingThumb,
            '&:hover': { backgroundColor: 'transparent' },
            '&.Mui-checked': {
              transform: `translateX(${SWITCH_TRAVEL}px)`,
              color: accent.contrastText,
              '&:hover': { backgroundColor: 'transparent' },
            },
            '&.Mui-checked + .MuiSwitch-track': { backgroundColor: accent.main, opacity: 1 },
            '&.Mui-disabled': { color: restingThumb },
            '&.Mui-disabled + .MuiSwitch-track, &.Mui-disabled .MuiSwitch-thumb': {
              opacity: DISABLED_OPACITY,
            },
          };
        },
        // MUI's input already spans the track sideways (300% of the thumb); this makes it a
        // full 24px tall too, centred on the thumb, so the target meets SC 2.5.8.
        input: {
          top: (SWITCH_THUMB - SWITCH_TARGET) / 2,
          height: SWITCH_TARGET,
        },
        thumb: { width: SWITCH_THUMB, height: SWITCH_THUMB, boxShadow: t.shadow.sm },
        track: {
          borderRadius: PILL,
          opacity: 1,
          // The unchecked track is the control's only outline: `control` holds it at 3:1.
          backgroundColor: t.control,
          transition: transition.control,
        },
      },
    },
  };
}

/** Everything a person types into, presses or toggles. */
export function inputs(parts: ThemeParts): ComponentGroup {
  return { ...buttons(parts), ...fields(parts), ...toggles(parts) };
}
