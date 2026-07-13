// Shared between the main and RENDERER processes — must stay free of `process`,
// `require`, and other Node-only globals, or importing it blanks the renderer window.
// The portal URL (which reads process.env) lives in the main process, in portal-client.ts.

/** Exactly what the app records, shown verbatim on the consent screen and in the tray. */
export const DISCLOSURE_ITEMS = [
  'Time worked, and whether you are active or idle',
  'The number of key presses and mouse clicks — never which keys, never what you type',
  'Which application and window is in the foreground, and for how long',
  'Periodic screenshots of your screen',
] as const;
