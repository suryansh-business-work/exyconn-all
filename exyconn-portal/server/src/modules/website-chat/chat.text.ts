import sanitizeHtml from 'sanitize-html';

/** Page chrome and non-content elements whose text is dropped with them. */
const NON_TEXT_TAGS = [
  'script',
  'style',
  'noscript',
  'textarea',
  'option',
  'svg',
  'nav',
  'header',
  'footer',
  'form',
  'template',
  'title',
];

const ENTITIES: Readonly<Record<string, string>> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

/** The readable text of an HTML page or fragment, whitespace collapsed. */
export function htmlToText(html: string): string {
  const text = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
    nonTextTags: NON_TEXT_TAGS,
  });
  return text
    .replaceAll(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity])
    .replaceAll(/\s+/g, ' ')
    .trim();
}

/** The page's `<title>`, or ''. */
export function titleOf(html: string): string {
  const match = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  return htmlToText(match?.[1] ?? '');
}

/** Splits text into pieces of about `size` characters, breaking between words. */
export function chunk(text: string, size: number, maxChunks: number): string[] {
  const pieces: string[] = [];
  let rest = text;
  while (rest.length > 0 && pieces.length < maxChunks) {
    if (rest.length <= size) {
      pieces.push(rest);
      break;
    }
    const cut = rest.lastIndexOf(' ', size);
    const end = cut > size / 2 ? cut : size;
    pieces.push(rest.slice(0, end).trim());
    rest = rest.slice(end).trim();
  }
  return pieces;
}
