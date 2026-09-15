import { describe, expect, it } from 'vitest';
import { sanitizeRichHtml } from '../../src/utils/sanitizeHtml';

describe('sanitizeRichHtml', () => {
  it('keeps the rich text the editor writes', () => {
    const html =
      '<h2>Terms</h2><p style="text-align: center">Hi <strong>you</strong> <em>there</em></p>' +
      '<ul data-type="taskList"><li data-checked="true">done</li></ul>' +
      '<table><tbody><tr><td colspan="2">cell</td></tr></tbody></table>' +
      '<blockquote><code>x</code></blockquote>';
    expect(sanitizeRichHtml(html)).toBe(html);
  });

  it('removes scripts, event handlers and unknown tags', () => {
    const out = sanitizeRichHtml(
      '<p onclick="alert(1)">a</p><script>alert(1)</script><iframe src="https://x.test"></iframe><img src="https://x.test/a.png" onerror="alert(1)">',
    );
    expect(out).toBe('<p>a</p><img src="https://x.test/a.png">');
  });

  it('allows only http, https, mailto and tel links', () => {
    expect(sanitizeRichHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
    expect(sanitizeRichHtml('<a href="data:text/html,hi">x</a>')).toBe('<a>x</a>');
    for (const href of ['https://a.test', 'http://a.test', 'mailto:a@b.test', 'tel:+1']) {
      expect(sanitizeRichHtml(`<a href="${href}">x</a>`)).toBe(`<a href="${href}">x</a>`);
    }
  });

  it('allows only https images', () => {
    expect(sanitizeRichHtml('<img src="http://a.test/x.png" alt="x">')).toBe('<img alt="x">');
    expect(sanitizeRichHtml('<img src="data:image/png;base64,AAAA">')).toBe('<img>');
  });

  it('adds rel to a link that opens a new tab', () => {
    expect(sanitizeRichHtml('<a href="https://a.test" target="_blank">x</a>')).toBe(
      '<a href="https://a.test" target="_blank" rel="noopener noreferrer">x</a>',
    );
  });

  it('keeps a check-list tick, and makes it read-only', () => {
    expect(sanitizeRichHtml('<label><input type="text" checked name="x"></label>')).toBe(
      '<label><input type="checkbox" checked="" disabled=""></label>',
    );
  });

  it('keeps only alignment and colour styles', () => {
    const out = sanitizeRichHtml(
      '<p style="position: fixed; color: red; background-color: blue; inset: 0">x</p>',
    );
    expect(out).toBe('<p style="color: red; background-color: blue">x</p>');
    expect(sanitizeRichHtml('<p style="position: fixed">x</p>')).toBe('<p>x</p>');
  });
});
