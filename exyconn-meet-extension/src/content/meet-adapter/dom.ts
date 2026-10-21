import type { Phrases } from './selectors';

/** Lower-cased, single-spaced text for phrase matching. */
export function normalizeText(value: string | null | undefined): string {
  return (value ?? '').replaceAll(/\s+/g, ' ').trim().toLocaleLowerCase();
}

/** True when the text is one of the exact phrases or contains one of the longer ones. */
export function matchesPhrases(text: string, phrases: Phrases): boolean {
  if (text.length === 0) {
    return false;
  }
  return phrases.exact.includes(text) || phrases.contains.some((phrase) => text.includes(phrase));
}

/**
 * True when the element is rendered for a person to see: neither it nor an ancestor is
 * `hidden`, `aria-hidden`, `display: none` or `visibility: hidden`. Layout-free on purpose,
 * so it behaves the same in a test DOM.
 */
export function isVisible(element: Element): boolean {
  const view = element.ownerDocument.defaultView;
  for (let node: Element | null = element; node !== null; node = node.parentElement) {
    if (node.hasAttribute('hidden') || node.getAttribute('aria-hidden') === 'true') {
      return false;
    }
    const style = view?.getComputedStyle(node);
    if (style?.display === 'none' || style?.visibility === 'hidden') {
      return false;
    }
  }
  return true;
}

/** Visible elements matching a selector. */
export function visibleAll(root: ParentNode, selector: string): Element[] {
  return [...root.querySelectorAll(selector)].filter(isVisible);
}

/** What a person (or a screen reader) reads for an element: its label, else its text. */
export function readableText(element: Element): string {
  return normalizeText(element.getAttribute('aria-label') ?? element.textContent);
}

/** True when any visible element under `selector` reads as one of the phrases. */
export function anyVisibleMatches(root: ParentNode, selector: string, phrases: Phrases): boolean {
  return visibleAll(root, selector).some((element) =>
    matchesPhrases(readableText(element), phrases),
  );
}
