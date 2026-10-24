import { sanitizeRichHtml } from '@exyconn/shell/utils/sanitizeHtml';
import { visibleText } from '@exyconn/shell/utils/visibleText';

/** The colours and font a message body is drawn with inside its frame. */
export interface MailFrameStyle {
  font: string;
  ink: string;
  paper: string;
  link: string;
}

/** Cleaned with the portal's allow-list, every link opening in a new tab. */
function cleanMailHtml(html: string) {
  const doc = new DOMParser().parseFromString(sanitizeRichHtml(html), 'text/html');
  for (const link of doc.querySelectorAll('a[href]')) {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  }
  return doc.body.innerHTML;
}

/** Where mail clients put the message being answered: Gmail, Yahoo and Apple Mail's cite. */
const QUOTE_SELECTOR = '.gmail_quote, .yahoo_quoted, blockquote[type="cite"]';
/** Outlook's "From: … Sent: …" header; the quoted message follows it. */
const OUTLOOK_REPLY = '#divRplyFwdMsg';

/** Takes the quoted earlier mail out of the document and returns it as HTML. */
function cutQuotes(doc: Document): string {
  const parts: string[] = [];
  const outlook = doc.querySelector(OUTLOOK_REPLY);
  let next: Element | null = outlook;
  while (next) {
    const current = next;
    next = current.nextElementSibling;
    parts.push(current.outerHTML);
    current.remove();
  }
  for (const quote of doc.querySelectorAll(QUOTE_SELECTOR)) {
    // A quote inside one already taken went with it.
    if (quote.isConnected) {
      parts.push(quote.outerHTML);
      quote.remove();
    }
  }
  return parts.join('');
}

/**
 * A message's HTML as the reader shows it. The server has cleaned it already; it is cleaned
 * again here (the portal's DOMPurify allow-list), and every link opens in a new tab. The
 * earlier mail it quotes comes back apart, to fold behind "⋯" as Gmail does; a message that
 * is nothing but quote stays whole.
 */
export function prepareMailHtml(html: string) {
  // Cut first: cleaning drops the ids Outlook marks its quote with. Parsing runs no script.
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const quoted = cutQuotes(doc);
  const main = cleanMailHtml(doc.body.innerHTML);
  if (visibleText(main) === '') {
    return { main: cleanMailHtml(html), quoted: '' };
  }
  return { main, quoted: quoted && cleanMailHtml(quoted) };
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
