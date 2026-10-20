import { alpha, type CSSObject, type Theme } from '../../styles';
import { AA_TEXT, blend, ensureContrast } from '../../a11y/contrast';
import { tintOpacity } from '../../tokens/backgrounds.token';
import { fontSize } from '../../tokens/font-size.token';
import { transition } from '../../tokens/motion.token';
import { spacing } from '../../tokens/spacing.token';
import { fontWeight } from '../../tokens/typography.token';
import {
  FLOATING_CORNER,
  HAIRLINE,
  INNER_CORNER,
  PILL_CORNER,
  ROUND,
  type ComponentGroup,
  type ThemeParts,
} from '../parts';

/** How much of a status hue a filled chip's pastel fill keeps, per mode. */
const CHIP_TINT = { light: 0.14, dark: 0.2 } as const;
/** The deeper tint a clickable pastel chip takes under the pointer or keyboard focus. */
const CHIP_TINT_ACTIVE = { light: 0.24, dark: 0.32 } as const;

type ChipHue = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
type ChipColor = ChipHue | 'default';

/**
 * A soft pastel chip: the hue thinned to a tint of the panel, and the hue itself as the ink —
 * moved, only if it must be, to 4.5:1 on that tint. "High" in mint, "Pending" in peach.
 */
function pastelChip({ mode, t }: ThemeParts, theme: Theme, hue: ChipHue): CSSObject {
  const main = theme.palette[hue].main;
  const fill = blend(main, t.background.panel, CHIP_TINT[mode]);
  const activeFill = blend(main, t.background.panel, CHIP_TINT_ACTIVE[mode]);
  // MUI swaps a clickable filled chip to the solid `main` (dark navy for primary) on hover and
  // focus while our ink stays `main` too, so the label vanished. Deepen the pastel instead.
  return {
    backgroundColor: fill,
    color: ensureContrast(main, fill, AA_TEXT),
    '&.MuiChip-clickable:hover, &.MuiChip-clickable.Mui-focusVisible': {
      backgroundColor: activeFill,
      color: ensureContrast(main, activeFill, AA_TEXT),
    },
  };
}

/** A chip's colours: neutral on the muted surface, a hue as a pastel, outlined left to MUI. */
function chipColours(
  parts: ThemeParts,
  theme: Theme,
  color: ChipColor,
  outlined: boolean,
): CSSObject {
  const { t } = parts;
  if (color === 'default') {
    return outlined
      ? { borderColor: t.divider }
      : { backgroundColor: t.background.muted, color: t.text.primary };
  }
  return outlined ? {} : pastelChip(parts, theme, color);
}

/** Badges are pastel pills; the neutral one sits on the muted surface. */
function chips(parts: ThemeParts): ComponentGroup {
  const { t } = parts;
  return {
    MuiChip: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          borderRadius: PILL_CORNER,
          fontWeight: fontWeight.medium,
          transition: transition.control,
          ...chipColours(
            parts,
            theme,
            ownerState.color ?? 'default',
            ownerState.variant === 'outlined',
          ),
        }),
        // MUI draws the neutral delete button at 26% ink — about 1.9:1. It is a control, so
        // it needs 3:1 (SC 1.4.11); the secondary ink gives it 4.5:1 on every surface. A
        // pastel chip's delete button wears the chip's own ink.
        deleteIcon: ({ ownerState }) =>
          ownerState.color === 'default'
            ? { color: t.text.secondary, '&:hover': { color: t.text.primary } }
            : { color: 'inherit', opacity: 0.8, '&:hover': { color: 'inherit', opacity: 1 } },
        // An icon in a pastel chip takes the chip's ink rather than MUI's mid tone.
        icon: { color: 'inherit' },
      },
    },
  };
}

/** Alerts carry a hairline in their own hue, as shadcn's do, over MUI's tinted fill. */
function alerts({ t }: ThemeParts): ComponentGroup {
  return {
    MuiAlert: {
      styleOverrides: {
        root: ({ ownerState, theme }) => {
          const hue = theme.palette[ownerState.color ?? ownerState.severity ?? 'success'].main;
          return {
            borderRadius: FLOATING_CORNER,
            ...(ownerState.variant === 'filled'
              ? {}
              : { border: `${HAIRLINE} ${alpha(hue, tintOpacity.strong)}` }),
          };
        },
        // MUI makes the message an `overflow: auto` box, which axe rightly reports as a
        // scrollable region a keyboard cannot reach (SC 2.1.1). An alert's message is a
        // sentence; it wraps instead of scrolling.
        message: { overflow: 'visible' },
      },
    },
    // A bare message snackbar is shadcn's toast (sonner): the popover surface, not MUI's
    // inverted grey slab.
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: t.background.panel,
          color: t.text.primary,
          border: `${HAIRLINE} ${t.divider}`,
          borderRadius: FLOATING_CORNER,
          boxShadow: t.shadow.lg,
        },
      },
    },
  };
}

/** Status and identity pieces: badges, tooltips, alerts, toasts, progress and avatars. */
export function feedback(parts: ThemeParts): ComponentGroup {
  const { t } = parts;
  return {
    ...chips(parts),
    ...alerts(parts),
    // shadcn's tooltip is the primary colour with its own ink — 15:1 or better in both modes.
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: t.primary,
          color: t.onPrimary,
          borderRadius: INNER_CORNER,
          fontSize: fontSize.xs,
          fontWeight: fontWeight.medium,
          paddingBlock: spacing(0.75),
          paddingInline: spacing(1.5),
        },
        arrow: { color: t.primary },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: PILL_CORNER },
        bar: { borderRadius: PILL_CORNER },
      },
    },
    // MUI's initials avatar is white on a mid grey — 1.9:1. The fallback is the muted surface
    // with the foreground ink, which reads in both modes. Avatars are circles (MUI's default).
    MuiAvatar: {
      styleOverrides: {
        colorDefault: { backgroundColor: t.background.muted, color: t.text.primary },
      },
    },
    MuiBadge: { styleOverrides: { badge: { borderRadius: PILL_CORNER } } },
    MuiSlider: { styleOverrides: { thumb: { borderRadius: ROUND } } },
  };
}
