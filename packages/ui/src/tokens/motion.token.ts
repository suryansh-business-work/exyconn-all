/** How long a transition runs, in ms. */
export const duration = { fast: 120, base: 200, slow: 320 } as const;

export type Duration = keyof typeof duration;

/** The one curve. A single easing is what makes unrelated animations feel like one system. */
export const easing = { standard: 'cubic-bezier(0.4, 0, 0.2, 1)' } as const;

/** Ready-made `transition` values, so a component never re-types the curve. */
export const transition = {
  color: `color ${duration.fast}ms ${easing.standard}`,
  surface: `border-color ${duration.fast}ms ${easing.standard}, background ${duration.fast}ms ${easing.standard}`,
} as const;
