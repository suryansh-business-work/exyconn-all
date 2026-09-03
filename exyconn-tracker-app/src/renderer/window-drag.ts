/**
 * The window is frameless, so the app's own bars have to say which pixels drag it.
 *
 * Shared because every bar needs both halves: a strip that drags, and buttons inside it that
 * opt back out — a control left on the drag region cannot be clicked at all.
 */
export const DRAG = { WebkitAppRegion: 'drag' } as const;
export const NO_DRAG = { WebkitAppRegion: 'no-drag' } as const;
