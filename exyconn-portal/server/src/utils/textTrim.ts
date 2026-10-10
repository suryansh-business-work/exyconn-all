/**
 * Linear-time text trimming. Regexes such as `/\/+$/`, `/^-+|-+$/` and `/<[^>]*>/g` retry
 * from every start position and run in quadratic time on a long run of the same character,
 * so these walk the string once instead.
 */

/** `value` without the `char` characters at its end. */
export function trimTrailing(value: string, char: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === char) {
    end -= 1;
  }
  return value.slice(0, end);
}

/** `value` without the `char` characters at its start. */
export function trimLeading(value: string, char: string): string {
  let start = 0;
  while (start < value.length && value[start] === char) {
    start += 1;
  }
  return value.slice(start);
}

/**
 * `html` with every `<...>` run replaced by `replacement` — the same as
 * `replaceAll(/<[^>]*>/g, replacement)`, or `<[^>]+>` when `minLength` is 1.
 */
export function stripTags(html: string, replacement = '', minLength = 0): string {
  let out = '';
  let copied = 0;
  let open = html.indexOf('<');
  while (open >= 0) {
    const close = html.indexOf('>', open + 1);
    if (close < 0) {
      break;
    }
    if (close - open - 1 < minLength) {
      open = html.indexOf('<', open + 1);
    } else {
      out += html.slice(copied, open) + replacement;
      copied = close + 1;
      open = html.indexOf('<', copied);
    }
  }
  return out + html.slice(copied);
}

const LINE_TERMINATORS = new Set(['\n', '\r', ' ', ' ']);

/**
 * `value` up to its first `delimiters` character that has no line break after it — the same
 * as `replace(/[delimiters].*$/, '')`, whose `.` stops at a line break.
 */
export function cutAtFirst(value: string, delimiters: string): string {
  let start = value.length;
  while (start > 0 && !LINE_TERMINATORS.has(value[start - 1])) {
    start -= 1;
  }
  for (let index = start; index < value.length; index += 1) {
    if (delimiters.includes(value[index])) {
      return value.slice(0, index);
    }
  }
  return value;
}
