import { color } from '@exyconn/ui';
import { firstFamily, pixels, toHex } from './css';
import type { Inline, Marks } from './model';

/** A `<mark>` written without a colour is the editor's default highlight. */
const DEFAULT_HIGHLIGHT = color.amber[200];

const TAG_MARKS: Readonly<Record<string, Marks>> = {
  STRONG: { bold: true },
  B: { bold: true },
  EM: { italic: true },
  I: { italic: true },
  U: { underline: true },
  S: { strike: true },
  STRIKE: { strike: true },
  DEL: { strike: true },
  CODE: { code: true },
  SUB: { sub: true },
  SUP: { sup: true },
};

/** What one element adds to the marks of the text inside it. */
function elementMarks(element: HTMLElement): Marks {
  const marks: Marks = { ...TAG_MARKS[element.tagName] };
  if (element.tagName === 'A') {
    marks.link = element.getAttribute('href') ?? undefined;
  }
  if (element.tagName === 'MARK') {
    marks.highlight =
      toHex(element.dataset.color) ?? toHex(element.style.backgroundColor) ?? DEFAULT_HIGHLIGHT;
  }
  const textColor = toHex(element.style.color);
  if (textColor) {
    marks.color = textColor;
  }
  const size = pixels(element.style.fontSize);
  if (size) {
    marks.fontSize = size;
  }
  const family = firstFamily(element.style.fontFamily);
  if (family) {
    marks.fontFamily = family;
  }
  return marks;
}

/** One node as inline content, carrying the marks of everything around it. */
export function inlineFrom(node: Node, marks: Marks): Inline[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    return text ? [{ kind: 'text', text, ...marks }] : [];
  }
  if (!(node instanceof HTMLElement)) {
    return [];
  }
  if (node.tagName === 'BR') {
    return [{ kind: 'break' }];
  }
  return parseInlines(node, { ...marks, ...elementMarks(node) });
}

/** The inline content of an element: its text runs and line breaks, in order. */
export function parseInlines(element: Node, marks: Marks = {}): Inline[] {
  return [...element.childNodes].flatMap((child) => inlineFrom(child, marks));
}

/** Whether the runs would print anything — whitespace between blocks does not. */
export function hasContent(inlines: readonly Inline[]): boolean {
  return inlines.some((inline) => inline.kind === 'break' || inline.text.trim() !== '');
}
