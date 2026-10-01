/** How long a transition runs, in ms. */
export const duration = { fast: 120, base: 200, slow: 320 } as const;

export type Duration = keyof typeof duration;

/** The one curve. A single easing is what makes unrelated animations feel like one system. */
export const easing = { standard: 'cubic-bezier(0.4, 0, 0.2, 1)' } as const;

/** Ready-made `transition` values, so a component never re-types the curve. */
export const transition = {
  color: `color ${duration.fast}ms ${easing.standard}`,
  surface: `border-color ${duration.fast}ms ${easing.standard}, background ${duration.fast}ms ${easing.standard}`,
  /** Every property a control changes on hover, press and focus — shadcn/ui's control transition. */
  control: ['color', 'background-color', 'border-color', 'box-shadow', 'opacity']
    .map((property) => `${property} ${duration.fast}ms ${easing.standard}`)
    .join(', '),
} as const;

/**
 * Keyframes the theme registers once, globally (see `theme/components/baseline.ts`), so any
 * surface can name them. Both only ever animate IN: leaving is MUI's own transition's job.
 */
export const keyframeName = { fadeIn: 'exy-fade-in', zoomIn: 'exy-zoom-in' } as const;

/** How far an entering element travels or shrinks from — small, so it reads as a settle. */
export const enterFrom = { offsetPx: 4, scale: 0.96 } as const;

/**
 * Ready-made enter animations. `backwards` holds the first frame during the delay and then lets
 * go: a `both` fill would leave `transform` on the element for good, and a transformed ancestor
 * turns every `position: fixed` child into an absolutely positioned one.
 */
export const enterAnimation = {
  page: `${keyframeName.fadeIn} ${duration.base}ms ${easing.standard} backwards`,
  dialog: `${keyframeName.zoomIn} ${duration.base}ms ${easing.standard} backwards`,
  /** One card, tile or row of a list; pair it with `staggerDelay` so the list settles in turn. */
  item: `${keyframeName.fadeIn} ${duration.base}ms ${easing.standard} backwards`,
} as const;

/** How far apart neighbouring items start, and how many stagger before the rest land together. */
const STAGGER_STEP_MS = 30;
const STAGGER_LIMIT = 8;

/**
 * The `animationDelay` for the nth item of a list. Capped, so a long list does not keep its
 * tail invisible for a second: after the first few the rest arrive with the last of them.
 */
export function staggerDelay(index: number): string {
  return `${Math.min(index, STAGGER_LIMIT) * STAGGER_STEP_MS}ms`;
}
