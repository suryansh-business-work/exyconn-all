/**
 * Output encoding for head values. Every value a page prints comes from data — a CMS
 * field, a tool description — so none of it is trusted to be markup-free.
 */

const ATTRIBUTE_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const TEXT_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

/** Characters that could end a `<script>` element or break a JS parser, and their escapes. */
const JSON_LD_ESCAPES: Readonly<Record<string, string>> = {
  '<': String.raw`\u003c`,
  '>': String.raw`\u003e`,
  '&': String.raw`\u0026`,
  '\u2028': String.raw`\u2028`,
  '\u2029': String.raw`\u2029`,
};

/** A value safe inside a double- or single-quoted attribute. */
export function escapeAttribute(value: string): string {
  return value.replaceAll(/[&<>"']/g, (char) => ATTRIBUTE_ESCAPES[char]);
}

/** A value safe as element text, e.g. inside `<title>`. */
export function escapeText(value: string): string {
  return value.replaceAll(/[&<>]/g, (char) => TEXT_ESCAPES[char]);
}

/**
 * JSON for a `<script type="application/ld+json">` body. The escapes are valid JSON string
 * escapes, so the parsed data is unchanged while no `</script>` or `<!--` can appear.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replaceAll(/[<>&\u2028\u2029]/g, (char) => JSON_LD_ESCAPES[char]);
}
