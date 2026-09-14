/** The widest a ring may grow, as a share of the window — it shares its row with a sentence. */
const MAX_WIDTH_SHARE = 0.6;

/**
 * A progress ring's diameter at the phone's text size (WCAG 1.4.4).
 *
 * The figure and caption inside the ring grow with the system font scale, so the ring grows
 * with them — never below its designed size, and never past a share of the window, so it
 * still fits beside its summary on a phone held at 200% text.
 */
export function ringDiameter(base: number, fontScale: number, windowWidth: number): number {
  const scaled = Math.min(base * fontScale, windowWidth * MAX_WIDTH_SHARE);
  return Math.max(base, scaled);
}
