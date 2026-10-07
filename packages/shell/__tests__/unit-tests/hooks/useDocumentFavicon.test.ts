import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useDocumentFavicon } from '@/hooks/useDocumentFavicon';

function addIconLink(href: string): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = href;
  document.head.appendChild(link);
  return link;
}

afterEach(() => {
  document.head.innerHTML = '';
});

describe('useDocumentFavicon', () => {
  it('points the tab icon at the branding image, and follows it when it changes', () => {
    const link = addIconLink('/exyconn-icon.svg');
    const { rerender } = renderHook(({ href }) => useDocumentFavicon(href), {
      initialProps: { href: 'https://cdn.example.test/acme.png' },
    });
    expect(link.href).toBe('https://cdn.example.test/acme.png');

    rerender({ href: 'https://cdn.example.test/acme-dark.png' });
    expect(link.href).toBe('https://cdn.example.test/acme-dark.png');
  });

  it('keeps the default icon when branding has no image', () => {
    const link = addIconLink('http://localhost:3000/exyconn-icon.svg');
    renderHook(() => useDocumentFavicon(''));
    expect(link.href).toBe('http://localhost:3000/exyconn-icon.svg');
  });

  it('does nothing on a page without an icon link', () => {
    renderHook(() => useDocumentFavicon('https://cdn.example.test/acme.png'));
    expect(document.querySelector('link[rel="icon"]')).toBeNull();
  });
});
