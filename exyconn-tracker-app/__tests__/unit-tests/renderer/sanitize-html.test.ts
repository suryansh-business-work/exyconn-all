// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sanitizeRichHtml } from '../../../src/renderer/sanitize-html';

/** Parses the sanitised HTML so a test can read attributes rather than string-match markup. */
function parse(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = sanitizeRichHtml(html);
  return host;
}

describe('sanitizeRichHtml', () => {
  it('turns a check-list input into a disabled checkbox the reader cannot tick', () => {
    const input = parse(
      '<ul data-type="taskList"><li><input type="text" checked>Done</li></ul>',
    ).querySelector('input');

    expect(input?.getAttribute('type')).toBe('checkbox');
    expect(input?.hasAttribute('disabled')).toBe(true);
    expect(input?.hasAttribute('checked')).toBe(true);
  });

  it('gives a link that opens a new window noopener and noreferrer', () => {
    const links = parse(
      '<a href="https://exyconn.com" target="_blank" rel="opener">a</a><a href="mailto:hr@exyconn.com">b</a>',
    ).querySelectorAll('a');

    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer');
    expect(links[1].getAttribute('href')).toBe('mailto:hr@exyconn.com');
    expect(links[1].hasAttribute('rel')).toBe(false);
  });

  it('keeps an https image and its size', () => {
    const img = parse(
      '<img src="https://cdn.exyconn.com/a.png" alt="Logo" width="40">',
    ).querySelector('img');

    expect(img?.getAttribute('src')).toBe('https://cdn.exyconn.com/a.png');
    expect(img?.getAttribute('width')).toBe('40');
  });

  it('keeps only alignment and colour from inline styles', () => {
    const p = parse(
      '<p style="text-align: center; color: red; position: fixed; background-color: yellow">x</p>',
    ).querySelector('p');

    const style = p?.getAttribute('style') ?? '';
    // The browser may spell the colours its own way; which declarations survive is the point.
    expect(style).toMatch(/^text-align: center; color: [^;]+; background-color: [^;]+$/);
    expect(style).not.toContain('position');
  });

  it('drops a style attribute that has nothing allowed in it', () => {
    const p = parse('<p style="position: fixed; top: 0">x</p>').querySelector('p');

    expect(p?.hasAttribute('style')).toBe(false);
  });

  it('keeps plain attribute values that are not URLs, and tables', () => {
    const cell = parse(
      '<table><tbody><tr><td colspan="2">a</td></tr></tbody></table>',
    ).querySelector('td');

    expect(cell?.getAttribute('colspan')).toBe('2');
  });

  it('drops tags outside the allow-list but keeps their text', () => {
    expect(sanitizeRichHtml('<section><iframe src="https://x.test"></iframe>Hi</section>')).toBe(
      'Hi',
    );
  });

  it('keeps an image that has no source as an empty image rather than failing', () => {
    expect(sanitizeRichHtml('<img alt="logo">')).toBe('<img alt="logo">');
  });
});
