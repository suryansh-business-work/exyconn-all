const ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (text: string) => text.replaceAll(/[&<>"']/g, (char) => ESCAPES[char]);

/**
 * Plain text as HTML paragraphs with its line breaks kept: an AI draft dropped into the
 * editor, or the earlier mail quoted under a reply.
 */
export function textToHtml(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
    .join('');
}

/** The message with the earlier mail quoted under it, as Gmail sends a reply. */
export function withQuote(html: string, quote?: string): string {
  return quote ? `${html}<blockquote>${textToHtml(quote)}</blockquote>` : html;
}
