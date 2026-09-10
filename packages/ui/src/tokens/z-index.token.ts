/**
 * Stacking order for the few places that need one of their own.
 *
 * MUI owns the layers above this (modal 1300, tooltip 1500 …) — never hand-write a number
 * that competes with those; these are for stacking WITHIN a component's own box.
 */
export const zIndex = { base: 0, raised: 1, overlay: 2, sticky: 10 } as const;

export type ZIndex = keyof typeof zIndex;
