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

/**
 * The webcam disclosure, stated by the APP rather than by the workspace.
 *
 * The consent text is authored in the portal, so an admin could switch webcam capture on and
 * never mention it. Being photographed at your desk is not something anyone should discover
 * afterwards, so the app says it itself, in its own words, and an admin cannot edit it away.
 */
export const WEBCAM_DISCLOSURE =
  'Your workspace also takes a photo from your webcam at the same moment as each screenshot, and places it in a corner of that screenshot. It happens only while tracking is on, every one is announced, and you can see them all — in this app and in the portal.';
