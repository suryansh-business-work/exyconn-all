import { alpha } from '../../styles';
import { spacing } from '../../tokens/spacing.token';
import { enterAnimation } from '../../tokens/motion.token';
import { SOLID_SURFACES } from '../../tokens/canvas.token';
import { fontWeight, numeric } from '../../tokens/typography.token';
import {
  CARD_CORNER,
  DIALOG_CORNER,
  HAIRLINE,
  PHONE,
  glassCard,
  type ComponentGroup,
  type ThemeParts,
} from '../parts';

/** A card's inner padding: roomy on a desk, a step tighter on a phone where width is scarce. */
const CARD_PADDING = spacing(3);
const PHONE_CARD_PADDING = spacing(2);
const PHONE_DIALOG_INSET = spacing(1);
/** How far a modal backdrop dims and softens what is behind it, per mode. */
const BACKDROP_DIM = { light: 0.28, dark: 0.6 } as const;
const BACKDROP_BLUR = 'blur(6px)';

function cards(parts: ThemeParts): ComponentGroup {
  const { t } = parts;
  return {
    // Paper stays opaque: menus, popovers and dialogs float over arbitrary content, and their
    // text must read whatever is beneath. Elevation comes from `theme.shadows`.
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: CARD_CORNER },
        outlined: { borderColor: t.divider },
      },
    },
    // A card is frosted glass on the canvas: the soft 20px corner, a light edge, a diffuse shadow.
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { ...glassCard(t), borderRadius: CARD_CORNER },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: CARD_PADDING,
          '&:last-child': { paddingBottom: CARD_PADDING },
          [PHONE]: {
            padding: PHONE_CARD_PADDING,
            '&:last-child': { paddingBottom: PHONE_CARD_PADDING },
          },
        },
      },
    },
  };
}

function dialogs({ mode, t }: ThemeParts): ComponentGroup {
  // The navy ink dims a light page; the night ground dims a dark one.
  const scrimInk = mode === 'light' ? t.text.primary : t.background.page;
  return {
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: DIALOG_CORNER,
          border: `${HAIRLINE} ${t.divider}`,
          boxShadow: t.shadow.lg,
          // shadcn's `zoom-in-95`: the panel settles in while MUI fades the backdrop.
          animation: enterAnimation.dialog,
          // On a phone a dialog is the screen: the 32px margins MUI keeps are a third of the
          // width, and what is inside them is usually a form or a table that needs every pixel.
          [PHONE]: {
            margin: PHONE_DIALOG_INSET,
            width: `calc(100% - ${PHONE_DIALOG_INSET * 2}px)`,
            maxWidth: `calc(100% - ${PHONE_DIALOG_INSET * 2}px)`,
            maxHeight: `calc(100% - ${PHONE_DIALOG_INSET * 2}px)`,
          },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { paddingTop: spacing(2), paddingBottom: spacing(2) },
      },
    },
    // A modal's backdrop: the ink at a low opacity with a soft frost, not MUI's flat black.
    // An invisible backdrop (a menu's click-catcher) stays invisible.
    MuiBackdrop: {
      styleOverrides: {
        root: ({ ownerState }) =>
          ownerState.invisible
            ? {}
            : {
                backgroundColor: alpha(scrimInk, BACKDROP_DIM[mode]),
                backdropFilter: BACKDROP_BLUR,
                [SOLID_SURFACES]: { backdropFilter: 'none' },
              },
      },
    },
  };
}

/** Surfaces that hold content: paper, cards, dialogs and tables. */
export function surfaces(parts: ThemeParts): ComponentGroup {
  const { t } = parts;
  return {
    ...cards(parts),
    ...dialogs(parts),
    MuiTable: { defaultProps: { size: 'small' } },
    // Tabular figures wherever digits line up in a column: a total that does not align
    // with the numbers above it is the first thing that makes a finance screen look cheap.
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: t.divider, fontVariantNumeric: numeric.tabular },
        head: { color: t.text.secondary, fontWeight: fontWeight.medium },
      },
    },
  };
}
