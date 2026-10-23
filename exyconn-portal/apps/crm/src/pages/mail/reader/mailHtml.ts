import { sanitizeRichHtml } from '@exyconn/shell/utils/sanitizeHtml';

/** The colours and font a message body is drawn with inside its frame. */
export interface MailFrameStyle {
  font: string;
  ink: string;
  paper: string;
  link: string;
}

/**
 * A message's HTML as the reader shows it. The server has cleaned it already; it is cleaned
 * again here (the portal's DOMPurify allow-list), and every link opens in a new tab.
 */
export function prepareMailHtml(html: string) {
  const doc = new DOMParser().parseFromString(sanitizeRichHtml(html), 'text/html');
  for (const link of doc.querySelectorAll('a[href]')) {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  }
  return doc.body.innerHTML;
}

/**
 * The whole document the sandboxed frame shows: a policy that allows no script and no request
 * but images (https and inline), and the message's own styles kept inside the frame so they
 * never reach the portal.
 */
export function mailDocument(body: string, style: MailFrameStyle) {
  const policy = "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'";
  const css = [
    `body{margin:0;padding:12px;font-family:${style.font};font-size:14px;line-height:1.5;color:${style.ink};background:${style.paper};overflow-wrap:anywhere}`,
    `a{color:${style.link}}`,
    'img,table{max-width:100%;height:auto}',
  ].join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><style>${css}</style></head><body>${body}</body></html>`;
}
