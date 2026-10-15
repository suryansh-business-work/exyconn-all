/** A ticket's own page, addressed by its key the way Jira does: `/projects/browse/EXY-14`. */
export const ticketPath = (key: string) => `/projects/browse/${encodeURIComponent(key)}`;

/** The parts of a mouse event that say whether it asked for a new tab. */
interface ClickIntent {
  ctrlKey: boolean;
  metaKey: boolean;
  button: number;
}

/** Ctrl-click, ⌘-click and the middle button all mean "open this somewhere else". */
export const wantsNewTab = (event: ClickIntent) =>
  event.ctrlKey || event.metaKey || event.button === 1;

/** Opens a ticket's page in a new tab, without handing that tab a handle back to this one. */
export function openTicketInNewTab(key: string) {
  globalThis.open(ticketPath(key), '_blank', 'noopener');
}
