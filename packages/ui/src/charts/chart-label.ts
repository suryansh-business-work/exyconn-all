import { createContext, useContext } from 'react';

/**
 * The id of the heading a chart sits under, handed down by `ChartCard`.
 *
 * Chart.js draws on a `<canvas role="img">`, which a screen reader announces as a nameless
 * "image" (WCAG 2.2 SC 1.1.1 / 4.1.2). Every chart in the workspace sits inside a ChartCard,
 * so the canvas is named by that card's own title — no call site has to remember to.
 */
export const ChartLabelContext = createContext<string | undefined>(undefined);

/** `aria-labelledby` for the canvas, when there is a heading to point at. */
export function useChartLabel(): { 'aria-labelledby'?: string } {
  const headingId = useContext(ChartLabelContext);
  return headingId === undefined ? {} : { 'aria-labelledby': headingId };
}
