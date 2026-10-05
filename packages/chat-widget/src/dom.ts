/** Tiny DOM helpers: the widget has no framework, so these keep the views readable. */

type Child = Node | string | null | undefined | false;
type AttrValue = string | number | boolean | undefined;
type Attrs = Record<string, AttrValue>;

/**
 * Builds an element. `class` sets the class name; `true` adds a bare attribute, `false` and
 * `undefined` leave it out. Listeners are attached by the caller (`on`), so attributes stay
 * plain data.
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Readonly<Attrs> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    setAttr(el, key, value);
  }
  appendChildren(el, children);
  return el;
}

export function setAttr(el: Element, key: string, value: AttrValue): void {
  if (value === undefined || value === false) {
    el.removeAttribute(key);
    return;
  }
  el.setAttribute(key, value === true ? '' : String(value));
}

function appendChildren(el: Element, children: readonly Child[]): void {
  for (const child of children) {
    if (child) {
      el.append(child);
    }
  }
}

/** Adds a listener and returns the element, so a build reads top to bottom. */
export function on<E extends HTMLElement, K extends keyof HTMLElementEventMap>(
  el: E,
  type: K,
  listener: (event: HTMLElementEventMap[K]) => void,
): E {
  el.addEventListener(type, listener);
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** A 24×24 Material icon path as an inline, screen-reader-hidden SVG. */
export function icon(path: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', 'cw-icon');
  const shape = document.createElementNS(SVG_NS, 'path');
  shape.setAttribute('d', path);
  svg.append(shape);
  return svg;
}

/** Makes `parent`'s children exactly `nodes`, in order, moving only what is out of place. */
export function syncChildren(parent: Element, nodes: readonly Node[]): void {
  nodes.forEach((node, index) => {
    const current = parent.childNodes[index];
    if (current !== node) {
      parent.insertBefore(node, current ?? null);
    }
  });
  while (parent.childNodes.length > nodes.length) {
    parent.lastChild?.remove();
  }
}

export function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Plays a Web Animations keyframe set unless the visitor asked for less motion. */
export function animate(el: Element, keyframes: Keyframe[], duration: number): void {
  if (!prefersReducedMotion() && typeof el.animate === 'function') {
    el.animate(keyframes, { duration, easing: 'ease-out' });
  }
}

/** Only links the widget can vouch for: the server's https media and our own previews. */
export function isSafeUrl(url: string): boolean {
  return url.startsWith('https://') || url.startsWith('http://') || url.startsWith('data:');
}
