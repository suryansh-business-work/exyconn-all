/**
 * `@exyconn/tabber` — the portal's one way to build tabs.
 *
 * Every tab set in the portal goes through this package so they all behave the
 * same: MUI Tabs for the look, and the active tab held in the URL as a slug so
 * it can be linked to, bookmarked, reloaded and walked with the back button.
 *
 * Use `Tabber` when each tab has its own panel, and `useTabberSlug` when the
 * page builds its own body from whichever tab is active.
 */
export { Tabber, type TabberProps } from './Tabber';
export { useTabberSlug, type TabberSlug } from './useTabberSlug';
export { resolveSlug, type ResolvedSlug } from './resolveSlug';
export type { TabberItem, TabberVariant } from './tabber.types';
