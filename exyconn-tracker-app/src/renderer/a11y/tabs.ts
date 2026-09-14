/**
 * The ids that tie a tab to the panel it shows (WAI-ARIA tabs pattern): each tab names the
 * panel in `aria-controls`, and the panel names the selected tab in `aria-labelledby`.
 * `base` must be unique on the page — pass a `useId()` for anything rendered more than once.
 */
export function tabId(base: string, value: string): string {
  return `${base}-tab-${value}`;
}

export function panelId(base: string): string {
  return `${base}-panel`;
}

/** The props for one tab. */
export function tabProps(base: string, value: string): { id: string; 'aria-controls': string } {
  return { id: tabId(base, value), 'aria-controls': panelId(base) };
}

/** The props for the one panel showing the selected tab's content. */
export function panelProps(
  base: string,
  selected: string,
): { role: 'tabpanel'; id: string; 'aria-labelledby': string } {
  return { role: 'tabpanel', id: panelId(base), 'aria-labelledby': tabId(base, selected) };
}

/** Where an arrow, Home or End key moves in a row of `count` tabs; null for any other key. */
export function nextTabIndex(
  key: string,
  current: number,
  count: number,
  rtl: boolean,
): number | null {
  const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
  const back = rtl ? 'ArrowRight' : 'ArrowLeft';
  if (key === forward) {
    return (current + 1) % count;
  }
  if (key === back) {
    return (current - 1 + count) % count;
  }
  if (key === 'Home') {
    return 0;
  }
  if (key === 'End') {
    return count - 1;
  }
  return null;
}
