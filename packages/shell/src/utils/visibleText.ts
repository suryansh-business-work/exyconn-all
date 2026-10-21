/**
 * The text a rich-text value shows, its tags dropped and the ends trimmed, so an editor holding
 * only empty tags (`<p></p>`) counts as empty. A `<` that is never closed is text, not a tag.
 * A single pass instead of a tag regex, so a long run of `<` cannot make it backtrack.
 */
export function visibleText(html: string): string {
  let text = '';
  let tagStart = -1;
  for (let index = 0; index < html.length; index += 1) {
    const char = html[index];
    if (tagStart >= 0) {
      if (char === '>') {
        tagStart = -1;
      }
    } else if (char === '<') {
      tagStart = index;
    } else {
      text += char;
    }
  }
  const unclosed = tagStart >= 0 ? html.slice(tagStart) : '';
  return (text + unclosed).trim();
}
