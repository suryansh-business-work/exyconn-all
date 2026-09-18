import { BASE_RADIUS } from '../../tokens/border.token';
import { transition } from '../../tokens/motion.token';
import { spacing } from '../../tokens/spacing.token';
import { fontWeight } from '../../tokens/typography.token';
import {
  CARD_CORNER,
  CONTROL_CORNER,
  HAIRLINE,
  INNER_CORNER,
  TOUCH,
  TOUCH_TARGET,
  type ComponentGroup,
  type ThemeParts,
} from '../parts';

const DENSE_TOOLBAR_HEIGHT = spacing(6);
const DENSE_LIST_PADDING = spacing(0.5);
/** A tab inside its track. */
const TAB_HEIGHT = spacing(4);
const TAB_TRACK_PADDING = spacing(0.5);
/** The track's corner wraps the tab's at the track's padding, so the two curves stay parallel. */
const TAB_TRACK_CORNER = `${BASE_RADIUS + TAB_TRACK_PADDING}px`;

/**
 * shadcn/ui's tabs: a muted track that hugs its tabs, the current tab raised out of it on the
 * page colour with a small shadow. Exported for the theme test, which pins the selected look.
 */
export function selectedTab({ t }: ThemeParts) {
  return { backgroundColor: t.background.page, color: t.text.primary, boxShadow: t.shadow.sm };
}

function tabs(parts: ThemeParts): ComponentGroup {
  const { t } = parts;
  return {
    MuiTabs: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          minHeight: TAB_HEIGHT + TAB_TRACK_PADDING * 2,
          [TOUCH]: { minHeight: TOUCH_TARGET + TAB_TRACK_PADDING * 2 },
          padding: TAB_TRACK_PADDING,
          borderRadius: TAB_TRACK_CORNER,
          backgroundColor: t.background.muted,
          // Hugs its tabs as shadcn's does; a full-width strip keeps its width, and a long
          // one still scrolls inside the page rather than past it.
          ...(ownerState.variant === 'fullWidth' ? {} : { width: 'fit-content', maxWidth: '100%' }),
          '&.MuiTabs-vertical': { borderRadius: CARD_CORNER },
        }),
        indicator: { display: 'none' },
        // An arrow with nowhere to scroll takes no room, so the first tab sits at the track's edge.
        scrollButtons: { borderRadius: CONTROL_CORNER, '&.Mui-disabled': { width: 0 } },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: TAB_HEIGHT,
          [TOUCH]: { minHeight: TOUCH_TARGET },
          paddingBlock: spacing(0.5),
          paddingInline: spacing(1.5),
          borderRadius: CONTROL_CORNER,
          textTransform: 'none',
          fontWeight: fontWeight.medium,
          color: t.text.secondary,
          transition: transition.control,
          '&:hover': { color: t.text.primary },
          '&.Mui-selected': selectedTab(parts),
        },
      },
    },
  };
}

function lists({ t }: ThemeParts): ComponentGroup {
  // The current row of any selectable list — the sidebar's page first of all — is shadcn's
  // sidebar accent: the muted fill in the foreground ink. The row's own weight change and
  // `aria-current` mark it for anyone who cannot tell the fill apart (SC 1.4.1).
  const current = { backgroundColor: t.background.muted, color: t.text.primary };
  return {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          paddingTop: DENSE_LIST_PADDING,
          paddingBottom: DENSE_LIST_PADDING,
          transition: transition.control,
          // The sidebar is the whole navigation on a phone; a 32px row is half a thumb.
          [TOUCH]: {
            minHeight: TOUCH_TARGET,
            paddingTop: spacing(1),
            paddingBottom: spacing(1),
          },
          '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible': current,
          '&.Mui-selected .MuiListItemIcon-root': { color: 'inherit' },
        },
      },
    },
  };
}

/** Menus and popovers: shadcn's `popover` — a padded, bordered panel of rounded rows. */
function menus({ t }: ThemeParts): ComponentGroup {
  const floating = {
    borderRadius: CONTROL_CORNER,
    border: `${HAIRLINE} ${t.divider}`,
    boxShadow: t.shadow.md,
  };
  return {
    MuiMenu: {
      styleOverrides: { paper: floating, list: { padding: spacing(0.5) } },
    },
    MuiMenuItem: {
      styleOverrides: {
        // shadcn's menu rows are `text-sm` — MUI's body2 — not body copy.
        root: ({ theme }) => ({
          ...theme.typography.body2,
          borderRadius: INNER_CORNER,
          paddingBlock: spacing(0.75),
          paddingInline: spacing(1),
          transition: transition.control,
          [TOUCH]: { minHeight: TOUCH_TARGET },
        }),
      },
    },
    MuiPopover: { styleOverrides: { paper: floating } },
  };
}

/** Where a person goes next: tabs, lists, menus, links and bars. */
export function navigation(parts: ThemeParts): ComponentGroup {
  return {
    ...tabs(parts),
    ...lists(parts),
    ...menus(parts),
    // Underlined by default (SC 1.4.1): the link colour against body text is about 2.5:1, so
    // colour alone does not mark a link. Links styled as buttons or nav set their own.
    MuiLink: {
      defaultProps: { underline: 'always' },
      styleOverrides: { root: { textUnderlineOffset: spacing(0.5) } },
    },
    MuiToolbar: { styleOverrides: { dense: { minHeight: DENSE_TOOLBAR_HEIGHT } } },
  };
}
