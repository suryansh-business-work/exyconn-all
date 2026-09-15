import sanitizeHtml from 'sanitize-html';

/** A colour as the editors write it: hex, or the rgb / rgba function a browser normalises it to. */
const COLOR =
  /^(#[\da-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/i;
const LENGTH = /^\d+(\.\d+)?(px|%|em|rem)$/;
const ALIGN = /^(left|right|center|justify)$/;

/**
 * Rich text written in the portal's editor (policy bodies) is rendered by the portal, the
 * desktop tracker and the website with `dangerouslySetInnerHTML` / `set:html`, so it is
 * cleaned when it is saved: a stored `<script>` or `onerror=` would otherwise run in every
 * reader's session.
 *
 * The allow-list is the website's article allow-list (exyconn-website
 * `src/lib/portal/sanitize.ts`), which is what the rich-text editor produces: headings,
 * lists, check lists, tables, images, code, links, and alignment / colour / highlight as
 * inline styles. Keep the two in step.
 */
const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    'h1',
    'h2',
    'img',
    'figure',
    'figcaption',
    'label',
    'input',
  ],
  allowedAttributes: {
    // `id` carries a live-editor design's CSS rules; `style` is filtered by allowedStyles.
    '*': ['class', 'id', 'style'],
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    th: ['colspan', 'rowspan', 'colwidth'],
    td: ['colspan', 'rowspan', 'colwidth'],
    ul: ['data-type'],
    li: ['data-type', 'data-checked'],
    mark: ['data-color'],
    input: ['type', 'checked', 'disabled'],
  },
  allowedStyles: {
    '*': { 'text-align': [ALIGN], color: [COLOR], 'background-color': [COLOR] },
    table: { width: [LENGTH], 'min-width': [LENGTH] },
    col: { width: [LENGTH], 'min-width': [LENGTH] },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    // A body may set target="_blank"; rel keeps such a link from reaching back at this page.
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    // The live editor's text toolbar writes <strike>; <s> is its current name.
    strike: 's',
    // The only input a body has is a check-list tick, and a reader cannot change it.
    input: (_tagName, attribs) => ({
      tagName: 'input',
      attribs: {
        type: 'checkbox',
        disabled: '',
        ...(attribs.checked === undefined ? {} : { checked: '' }),
      },
    }),
  },
};

/** The HTML, stripped of anything that is not safe to inject into a page. */
export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, RICH_TEXT_OPTIONS);
}
