import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentFonts } from '../../../../../src/pages/cms/design-system/useDocumentFonts';

const links = () =>
  Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map(
    (link) => link.href,
  );
const styles = () =>
  Array.from(document.head.querySelectorAll('style'))
    .map((style) => style.textContent ?? '')
    .filter((text) => text.includes('@font-face'));

const FIRST = 'https://fonts.googleapis.com/css2?family=Inter';
const SECOND = 'https://fonts.googleapis.com/css2?family=Lora';
const FACE = '@font-face { font-family: "Brand"; }';

describe('useDocumentFonts', () => {
  it('adds the stylesheet and the font faces to the page, and swaps them on change', () => {
    const { rerender, unmount } = renderHook(
      (props: Readonly<{ url: string; css?: string }>) => useDocumentFonts(props.url, props.css),
      { initialProps: { url: FIRST, css: FACE } },
    );

    expect(links()).toContain(FIRST);
    expect(styles()).toEqual([FACE]);

    rerender({ url: SECOND, css: FACE });
    expect(links()).toContain(SECOND);
    expect(links()).not.toContain(FIRST);

    unmount();
    expect(links()).not.toContain(SECOND);
    expect(styles()).toEqual([]);
  });

  it('adds nothing without a stylesheet or faces', () => {
    const before = document.head.children.length;
    const { unmount } = renderHook(() => useDocumentFonts(''));

    expect(document.head.children.length).toBe(before);
    unmount();
  });
});
