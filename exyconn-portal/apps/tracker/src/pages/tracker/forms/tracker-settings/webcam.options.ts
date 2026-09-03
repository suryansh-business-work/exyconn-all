/**
 * Where the webcam photo sits on the screenshot. Values match the server's WEBCAM_CORNERS —
 * the desktop app places the photo by this exact string, so the two lists must not drift.
 */
export const WEBCAM_CORNER_OPTIONS = [
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'top-right', label: 'Top right' },
  { value: 'top-left', label: 'Top left' },
] as const;

/** The corner values the form accepts, for the Zod schema. */
export const WEBCAM_CORNERS = WEBCAM_CORNER_OPTIONS.map((option) => option.value);
