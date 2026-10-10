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

/** `html` with every `<...>` run removed — the same as `replaceAll(/<[^>]*>/g, "")`. */
export function stripTags(html: string): string {
  let out = "";
  let copied = 0;
  let open = html.indexOf("<");
  while (open >= 0) {
    const close = html.indexOf(">", open + 1);
    if (close < 0) {
      break;
    }
    out += html.slice(copied, open);
    copied = close + 1;
    open = html.indexOf("<", copied);
  }
  return out + html.slice(copied);
}
