import { spacing } from '../../tokens/spacing.token';
import { enterAnimation } from '../../tokens/motion.token';
import { numeric } from '../../tokens/typography.token';
import { CARD_CORNER, HAIRLINE, PHONE, type ComponentGroup, type ThemeParts } from '../parts';

/** Compact density: this is dense, data-heavy chrome, so every primitive starts small. */
const DENSE_CARD_PADDING = spacing(1.5);
const PHONE_DIALOG_INSET = spacing(1);

function cards({ t }: ThemeParts): ComponentGroup {
  return {
    // Flat surfaces: no background gradient; elevation comes from `theme.shadows`, which is
    // the shadcn scale, so an `elevation` prop anywhere in the portals lands on it.
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: CARD_CORNER },
        outlined: { borderColor: t.divider },
      },
    },
    // shadcn's card: `rounded-xl border shadow-sm` on the panel colour.
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: CARD_CORNER,
          border: `${HAIRLINE} ${t.divider}`,
          boxShadow: t.shadow.sm,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: DENSE_CARD_PADDING,
          '&:last-child': { paddingBottom: DENSE_CARD_PADDING },
        },
      },
    },
  };
}

function dialogs({ t }: ThemeParts): ComponentGroup {
  return {
    MuiDialog: {
      styleOverrides: {
        paper: {
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
        root: { paddingTop: DENSE_CARD_PADDING, paddingBottom: DENSE_CARD_PADDING },
      },
    },
  };
}

/** Surfaces that hold content: paper, cards, dialogs and tables. */
export function surfaces(parts: ThemeParts): ComponentGroup {
  return {
    ...cards(parts),
    ...dialogs(parts),
    MuiTable: { defaultProps: { size: 'small' } },
    // Tabular figures wherever digits line up in a column: a total that does not align
    // with the numbers above it is the first thing that makes a finance screen look cheap.
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: parts.t.divider, fontVariantNumeric: numeric.tabular },
      },
    },
  };
}
