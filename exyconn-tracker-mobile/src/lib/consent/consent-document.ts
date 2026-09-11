/**
 * The page the consent disclosure is shown in.
 *
 * The disclosure is HTML an administrator wrote in the portal, and it is handled as untrusted:
 * the page's Content-Security-Policy forbids every script, frame, form and remote resource
 * except images, so nothing in it can run or phone home, and `linkAction` decides every
 * navigation it attempts. The only script in the web view is the app's own height reporter,
 * which the native side injects outside the page (and outside its policy).
 */

/** The theme the page is drawn in — raw colours, read from the app's theme at runtime. */
export interface ConsentPalette {
  ink: string;
  muted: string;
  hairline: string;
  link: string;
}

/** Wraps the disclosure, so its height can be measured without the page's own margins. */
const ROOT_ID = 'exyconn-consent';

/** The phone's body size, scaled by the reader's own text-size setting. */
const BASE_FONT_PX = 16;

const POLICY = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  'img-src https: data:',
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function styles(palette: ConsentPalette, fontScale: number): string {
  return `
html, body { margin: 0; padding: 0; background: transparent; }
body {
  color: ${palette.ink};
  font-family: -apple-system, system-ui, Roboto, sans-serif;
  font-size: ${BASE_FONT_PX * fontScale}px;
  line-height: 1.6;
  overflow-wrap: break-word;
  -webkit-text-size-adjust: 100%;
}
#${ROOT_ID} { display: flow-root; }
#${ROOT_ID} > :first-child { margin-top: 0; }
#${ROOT_ID} > :last-child { margin-bottom: 0; }
h1 { font-size: 1.25em; margin: 1em 0 0.5em; }
h2 { font-size: 1.1em; font-weight: 700; margin: 1em 0 0.5em; }
h3, h4 { font-size: 1em; margin: 0.75em 0 0.4em; }
p { margin: 0.5em 0; }
ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
li { margin-bottom: 0.25em; }
strong, b { font-weight: 700; }
small, figcaption { color: ${palette.muted}; }
a { color: ${palette.link}; }
img { max-width: 100%; height: auto; }
hr { border: none; border-top: 1px solid ${palette.hairline}; margin: 1em 0; }
table { border-collapse: collapse; max-width: 100%; }
td, th { border: 1px solid ${palette.hairline}; padding: 0.25em 0.5em; }
`;
}

/** The whole document: the policy first, so nothing in the disclosure can loosen it. */
export function consentDocument(html: string, palette: ConsentPalette, fontScale = 1): string {
  return [
    '<!doctype html><html><head><meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${POLICY}">`,
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<style>${styles(palette, fontScale)}</style>`,
    `</head><body><div id="${ROOT_ID}">`,
    html,
    '</div></body></html>',
  ].join('');
}

/**
 * The app's one script in the web view: it reports the disclosure's height, and again whenever
 * that changes (an image arriving, the font settling), so the view can be exactly as tall as
 * what it shows and the page scrolls as one.
 */
export const HEIGHT_REPORTER = `(function () {
  var root = document.getElementById('${ROOT_ID}');
  function report() {
    window.ReactNativeWebView.postMessage(String(Math.ceil(root.getBoundingClientRect().height)));
  }
  report();
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(report).observe(root);
  }
  window.addEventListener('load', report);
})();
true;`;

/** A reported height, or null for anything that is not one. */
export function parseHeight(data: string): number | null {
  const height = Number(data);
  return Number.isFinite(height) && height > 0 ? height : null;
}

/** What a tap on a link inside the disclosure does. */
export type LinkAction = 'stay' | 'browser' | 'block';

/** The schemes a disclosure may link out to — the web, and email. */
const BROWSER_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

/** The document itself is `about:blank` — including a jump to an anchor inside it. */
const DOCUMENT_URL = 'about:blank';

/**
 * Where a navigation from inside the disclosure may go. The document never leaves the web
 * view: web and mail links go to the system browser or mail app, where the reader can see
 * where they are — but only straight after the reader touched the disclosure. The page's
 * policy stops scripts, not a `<meta http-equiv="refresh">`, and that must not be able to
 * throw somebody into a browser they did not ask for. Anything else goes nowhere.
 */
export function linkAction(url: string, tapped: boolean): LinkAction {
  if (url === DOCUMENT_URL || url.startsWith(`${DOCUMENT_URL}#`)) {
    return 'stay';
  }
  const scheme = url.slice(0, url.indexOf(':') + 1).toLowerCase();
  return tapped && BROWSER_SCHEMES.has(scheme) ? 'browser' : 'block';
}
