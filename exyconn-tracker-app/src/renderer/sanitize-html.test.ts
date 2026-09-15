// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sanitizeRichHtml } from './sanitize-html';

describe('sanitizeRichHtml (consent notice)', () => {
  it('keeps the formatting a notice is written with', () => {
    const html =
      '<h2>What we record</h2><ul><li><strong>Screenshots</strong></li></ul><p>See <a href="https://exyconn.com">policy</a></p>';
    expect(sanitizeRichHtml(html)).toBe(html);
  });

  it('removes scripts, handlers, unsafe links and non-https images', () => {
    const out = sanitizeRichHtml(
      '<p onmouseover="x()">a</p><script>x()</script><a href="javascript:x()">b</a><img src="http://a.test/i.png">',
    );
    expect(out).toBe('<p>a</p><a>b</a><img>');
  });
});
