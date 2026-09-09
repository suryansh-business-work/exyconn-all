import {
  appendPixel,
  instrument,
  rewriteLinks,
  safeRedirectTarget,
} from '../../src/modules/marketing/marketing.tracking';

const ORIGIN = 'https://portal.example.com';
const TOKEN = 'tok123';

describe('rewriteLinks', () => {
  it('points a link at the redirect, carrying where it was going', () => {
    const html = '<a href="https://example.com/offer">Offer</a>';

    const out = rewriteLinks(html, ORIGIN, TOKEN);

    expect(out).toContain(`${ORIGIN}/m/c/${TOKEN}?u=`);
    expect(out).toContain(encodeURIComponent('https://example.com/offer'));
  });

  it('handles single-quoted hrefs, because real-world HTML has them', () => {
    const out = rewriteLinks("<a href='https://example.com/a'>A</a>", ORIGIN, TOKEN);

    expect(out).toContain('/m/c/');
  });

  it('leaves a javascript: link alone rather than redirecting to a script', () => {
    // The one that matters: rewriting this would put our domain in front of a script.
    const html = `<a href="javascript:alert(1)">x</a>`;

    expect(rewriteLinks(html, ORIGIN, TOKEN)).toBe(html);
  });

  it('leaves mailto and anchors alone', () => {
    const html = '<a href="mailto:a@b.com">mail</a><a href="#top">top</a>';

    expect(rewriteLinks(html, ORIGIN, TOKEN)).toBe(html);
  });

  it('leaves the unsubscribe link untracked', () => {
    // A legal obligation must not depend on the tracker being up.
    const html = '<a href="https://portal.example.com/u/abc">Unsubscribe</a>';

    expect(rewriteLinks(html, ORIGIN, TOKEN, ['/u/'])).toBe(html);
  });

  it('rewrites every link, not just the first', () => {
    const html = '<a href="https://a.com">a</a><a href="https://b.com">b</a>';

    expect(rewriteLinks(html, ORIGIN, TOKEN).match(/\/m\/c\//g)).toHaveLength(2);
  });

  it('encodes a target that carries its own query string', () => {
    const html = '<a href="https://example.com/p?a=1&b=2">x</a>';

    const out = rewriteLinks(html, ORIGIN, TOKEN);

    // The whole target must survive as ONE parameter, not split the redirect's own query.
    expect(out).toContain(encodeURIComponent('https://example.com/p?a=1&b=2'));
  });

  it('has nothing to do to a body with no links', () => {
    expect(rewriteLinks('<p>Hello</p>', ORIGIN, TOKEN)).toBe('<p>Hello</p>');
  });
});

describe('appendPixel', () => {
  it('adds a hidden 1×1 image at the end', () => {
    const out = appendPixel('<p>Hi</p>', ORIGIN, TOKEN);

    expect(out.startsWith('<p>Hi</p>')).toBe(true);
    expect(out).toContain(`${ORIGIN}/m/o/${TOKEN}.gif`);
    expect(out).toContain('width="1"');
  });
});

describe('instrument', () => {
  it('does both, leaving the content first', () => {
    const out = instrument('<a href="https://a.com">a</a>', ORIGIN, TOKEN);

    expect(out).toContain('/m/c/');
    expect(out).toContain('/m/o/');
  });
});

describe('safeRedirectTarget', () => {
  it('follows http and https', () => {
    expect(safeRedirectTarget('https://example.com')).toBe('https://example.com');
    expect(safeRedirectTarget('http://example.com')).toBe('http://example.com');
  });

  it('refuses anything else, so the endpoint is not an open redirect to a script', () => {
    expect(safeRedirectTarget('javascript:alert(1)')).toBeNull();
    expect(safeRedirectTarget('data:text/html;base64,x')).toBeNull();
    expect(safeRedirectTarget('/relative')).toBeNull();
    expect(safeRedirectTarget(undefined)).toBeNull();
  });
});
