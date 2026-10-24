/** The only permissions the extension asks for, each with a reason (see README). */
export const PERMISSIONS = ['storage', 'alarms', 'notifications', 'tabCapture', 'offscreen'];

export const MEET_MATCH = 'https://meet.google.com/*';
export const ICON_SIZES = [16, 32, 48, 128];
export const MIN_CHROME_VERSION = '116';

/**
 * The Manifest V3 for one build. Host access is limited to Google Meet and the API origin of
 * the mode. `key` (a PUBLIC key, optional) pins the extension id for internal unpacked
 * installs; the Chrome Web Store package is made without it (scripts/package.mjs).
 * `versionName` (optional) is the friendlier version Chrome shows, e.g. "1.2.0 (build 57)".
 */
export function buildManifest({ version, versionName, apiUrl, key }) {
  const icons = Object.fromEntries(
    ICON_SIZES.map((size) => [String(size), `icons/icon-${size}.png`]),
  );
  const manifest = {
    manifest_version: 3,
    name: 'Exyconn Meeting Assistant',
    description:
      'Reminds you when Google Meet transcription is off and, with consent, turns your meetings into notes and action items in Exyconn.',
    version,
    ...(versionName ? { version_name: versionName } : {}),
    minimum_chrome_version: MIN_CHROME_VERSION,
    icons,
    action: {
      default_popup: 'popup.html',
      default_title: 'Exyconn Meeting Assistant',
      default_icon: icons,
    },
    background: { service_worker: 'background.js', type: 'module' },
    content_scripts: [{ matches: [MEET_MATCH], js: ['content.js'], run_at: 'document_idle' }],
    options_ui: { page: 'options.html', open_in_tab: true },
    permissions: PERMISSIONS,
    host_permissions: [`${new URL(apiUrl).origin}/*`, MEET_MATCH],
    content_security_policy: { extension_pages: "script-src 'self'; object-src 'self'" },
  };
  return key ? { ...manifest, key } : manifest;
}

/** The store package's manifest: the same, minus the `key` (the store assigns the id). */
export function storeManifest(manifest) {
  return Object.fromEntries(Object.entries(manifest).filter(([field]) => field !== 'key'));
}
