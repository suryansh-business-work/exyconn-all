/** The named entities plain text from HTML-escaping sources (Gmail snippets) carries. */
const NAMED: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

const MAX_CODE_POINT = 0x10ffff;

/** `#39` → `'`, `#x27` → `'`; an out-of-range number stays as written. */
function numericEntity(entity: string, code: string): string {
  const hex = code[1] === 'x' || code[1] === 'X';
  const point = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
  return point > 0 && point <= MAX_CODE_POINT ? String.fromCodePoint(point) : entity;
}

/**
 * Plain text with its HTML entities decoded — `you&#39;re` → `you're` — in one pass, so an
 * escaped entity (`&amp;lt;`) decodes once (`&lt;`), never twice. Unknown entities stay as
 * written. The result is text, not HTML: render it as text.
 */
export function decodeHtmlEntities(text: string): string {
  return text.replaceAll(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) =>
    code.startsWith('#') ? numericEntity(entity, code) : (NAMED[code.toLowerCase()] ?? entity),
  );
}
