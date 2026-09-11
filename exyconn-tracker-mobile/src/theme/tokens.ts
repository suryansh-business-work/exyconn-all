// The design system's shape tokens, by path (its entry imports MUI): controls round to
// TRACKER_RADIUS, cards to TRACKER_CARD_RADIUS, and pills to radius.pill.
export {
  TRACKER_CARD_RADIUS,
  TRACKER_RADIUS,
  borderWidth,
  radius,
} from '@exyconn/ui/src/tokens/border.token';
// The trackers' own colour roles (activity levels, the day bar, the tab bar, a selection) —
// one file both apps read, so the phone and the laptop draw the same colours.
export {
  trackerActivity,
  trackerProgressGradient,
  trackerSelected,
  trackerTabBar,
} from '@exyconn/ui/src/tokens/tracker.token';
