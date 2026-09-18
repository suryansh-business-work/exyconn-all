import { alpha } from '../../styles';
import { tintOpacity } from '../../tokens/backgrounds.token';
import { fontSize } from '../../tokens/font-size.token';
import { transition } from '../../tokens/motion.token';
import { spacing } from '../../tokens/spacing.token';
import { fontWeight } from '../../tokens/typography.token';
import { CONTROL_CORNER, HAIRLINE, PILL, type ComponentGroup, type ThemeParts } from '../parts';

/** shadcn's badge: a small rounded-md label, the neutral one on the muted surface. */
function chips({ t }: ThemeParts): ComponentGroup {
  return {
    MuiChip: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: CONTROL_CORNER,
          fontWeight: fontWeight.medium,
          transition: transition.control,
          ...(ownerState.color === 'default' && ownerState.variant !== 'outlined'
            ? { backgroundColor: t.background.muted, color: t.text.primary }
            : {}),
          ...(ownerState.color === 'default' && ownerState.variant === 'outlined'
            ? { borderColor: t.divider }
            : {}),
        }),
        // MUI draws the neutral delete button at 26% ink — about 1.9:1. It is a control, so
        // it needs 3:1 (SC 1.4.11); the secondary ink gives it 4.5:1 on every surface.
        deleteIcon: ({ ownerState }) =>
          ownerState.color === 'default'
            ? { color: t.text.secondary, '&:hover': { color: t.text.primary } }
            : {},
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
            borderRadius: CONTROL_CORNER,
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
          borderRadius: CONTROL_CORNER,
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
          borderRadius: CONTROL_CORNER,
          fontSize: fontSize.xs,
          fontWeight: fontWeight.medium,
          paddingBlock: spacing(0.75),
          paddingInline: spacing(1.5),
        },
        arrow: { color: t.primary },
      },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: PILL }, bar: { borderRadius: PILL } },
    },
    // MUI's initials avatar is white on a mid grey — 1.9:1. shadcn's fallback is the muted
    // surface with the foreground ink, which reads in both modes.
    MuiAvatar: {
      styleOverrides: {
        colorDefault: { backgroundColor: t.background.muted, color: t.text.primary },
      },
    },
  };
}
