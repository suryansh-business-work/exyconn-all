/** The longest key the server accepts (`CRM_PROPERTY_KEY`). */
const MAX_KEY = 40;
/** Characters that become a `_` between words; anything else that is not a letter or digit is dropped. */
const SEPARATORS: ReadonlySet<string> = new Set([' ', '-', '_']);

const isLetter = (char: string) => char >= 'a' && char <= 'z';
const isDigit = (char: string) => char >= '0' && char <= '9';

/** Drops `_` from the end of a key: "lead_score_" -> "lead_score". */
function trimTrailingUnderscores(key: string): string {
  let end = key.length;
  while (end > 0 && key[end - 1] === '_') {
    end -= 1;
  }
  return key.slice(0, end);
}

/**
 * A key made from a label: "Lead score (0-100)" -> "lead_score_0_100". Lowercase letters, digits
 * and single `_` between words, starting with a letter, at most 40 characters — the shape
 * `CRM_PROPERTY_KEY` accepts. Empty when the label has no letter to start from.
 */
export function keyFromLabel(label: string): string {
  let key = '';
  for (const char of label.toLowerCase()) {
    if (isLetter(char) || (key !== '' && isDigit(char))) {
      key += char;
    } else if (key !== '' && SEPARATORS.has(char) && !key.endsWith('_')) {
      key += '_';
    }
  }
  return trimTrailingUnderscores(trimTrailingUnderscores(key).slice(0, MAX_KEY));
}
