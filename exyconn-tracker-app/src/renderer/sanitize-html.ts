import DOMPurify from 'dompurify';

/**
 * The consent notice is authored by a workspace admin in the portal and rendered with
 * `dangerouslySetInnerHTML`, so it is sanitised first: "an admin wrote it" is not the same as
 * "it is safe to inject" into a window that holds the employee's session.
 *
 * This mirrors `packages/shell/src/utils/sanitizeHtml.ts` rule for rule. It is a copy because
 * the tracker cannot import `@exyconn/shell`: the shell is a portal-only source package (Apollo,
 * the portal router, MUI X) that this app does not depend on, and pulling it in for one
 * function would ship all of that into the desktop renderer. Change both together.
 *
 * Allowed: headings, paragraphs, lists (with check lists), tables, quotes, code, links and
 * images, plus alignment and colour as inline styles. Links may only use http, https, mailto
 * and tel; images only https.
 */
// prettier-ignore
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'div', 'span',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'sub', 'sup',
  'a', 'img', 'figure', 'figcaption', 'label', 'input',
  'table', 'caption', 'colgroup', 'col', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
];

// prettier-ignore
const ALLOWED_ATTR = [
  'href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height',
  'colspan', 'rowspan', 'class', 'style', 'data-type', 'data-checked', 'type', 'checked',
];

/**
 * DOMPurify's default URI rule with the scheme list cut to http, https, mailto and tel. The
 * second half must stay: DOMPurify also tests plain attribute values (`colspan="2"`,
 * `target="_blank"`) against it, and a value with no scheme is not a URL. Images are
 * narrowed to https in the hook below.
 */
const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i;

/** The inline styles the editor writes; any other declaration is dropped. */
const ALLOWED_STYLES = ['text-align', 'color', 'background-color'] as const;

/** A dedicated instance, so these hooks never reach any other DOMPurify user in the page. */
const purifier = DOMPurify();

purifier.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'IMG' && !/^https:/i.test(node.getAttribute('src') ?? '')) {
    node.removeAttribute('src');
  }
  // The only input a body has is a check-list tick, and a reader cannot change it.
  if (node.tagName === 'INPUT') {
    node.setAttribute('type', 'checkbox');
    node.setAttribute('disabled', '');
  }
  if (node.tagName === 'A' && node.hasAttribute('target')) {
    node.setAttribute('rel', 'noopener noreferrer');
  }
  if (node instanceof HTMLElement && node.hasAttribute('style')) {
    const kept = ALLOWED_STYLES.map((name) => [name, node.style.getPropertyValue(name)] as const)
      .filter(([, value]) => value !== '')
      .map(([name, value]) => `${name}: ${value}`);
    if (kept.length === 0) {
      node.removeAttribute('style');
    } else {
      node.setAttribute('style', kept.join('; '));
    }
  }
});

/** The HTML with everything outside the consent-notice allow-list removed. */
export function sanitizeRichHtml(html: string): string {
  return purifier.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOWED_URI_REGEXP });
}
