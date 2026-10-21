/**
 * Build-time configuration, injected by scripts/build.mjs through Vite's `define` from
 * scripts/modes.json. Nothing here is a secret: the extension holds no API keys of any kind.
 */
declare const __API_URL__: string;
declare const __PORTAL_URL__: string;
declare const __MODE__: string;
declare const __VERSION__: string;

/** The portal API origin, e.g. https://portal-server.exyconn.com. */
export const API_URL: string = __API_URL__;
/** The employee portal, where sign-in and the meeting pages live. */
export const PORTAL_URL: string = __PORTAL_URL__;
export const BUILD_MODE: string = __MODE__;
export const EXTENSION_VERSION: string = __VERSION__;

/** Where "Open portal" lands: the employee's meetings. */
export const PORTAL_MEETINGS_PATH = '/me/meetings';
/** The portal page that runs the extension's PKCE sign-in. */
export const PORTAL_CONNECT_PATH = '/me/meetings/connect-extension';
