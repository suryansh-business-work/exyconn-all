import {
  PIXEL,
  TRACKING_PATH,
  extractLinks,
  hashTrackingToken,
  newTrackingToken,
  rewriteLinks,
  signLink,
  verifyLinkSignature,
} from '../../../../src/modules/marketing/marketing.tracking';

const ORIGIN = 'https://portal.example.com';
const URL_A = 'https://example.com/offer';

describe('tracking tokens', () => {
  it('mints a fresh opaque token each time and keeps only its SHA-256', () => {
    const first = newTrackingToken();
    const second = newTrackingToken();

    expect(first.token).not.toBe(second.token);
    expect(first.token).toMatch(/^[\w-]{32}$/);
    expect(first.tokenHash).toBe(hashTrackingToken(first.token));
    expect(first.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashes the same token to the same value, so a send can be found from its link', () => {
    expect(hashTrackingToken('abc')).toBe(hashTrackingToken('abc'));
    expect(hashTrackingToken('abc')).not.toBe(hashTrackingToken('abd'));
  });

  it('serves its pixel from a short public path as a real GIF', () => {
    expect(TRACKING_PATH).toBe('/m');
    expect(PIXEL.subarray(0, 6).toString('ascii')).toBe('GIF89a');
  });
});

describe('link signatures', () => {
  it('signs a link with a fixed-length signature that verifies', () => {
    const signature = signLink('tok', URL_A);

    expect(signature).toHaveLength(32);
    expect(signLink('tok', URL_A)).toBe(signature);
    expect(verifyLinkSignature('tok', URL_A, signature)).toBe(true);
  });

  it('refuses the signature once the target or the token changes', () => {
    const signature = signLink('tok', URL_A);

    expect(verifyLinkSignature('tok', 'https://evil.example', signature)).toBe(false);
    expect(verifyLinkSignature('other', URL_A, signature)).toBe(false);
  });

  it('refuses a signature of the wrong length without comparing it', () => {
    expect(verifyLinkSignature('tok', URL_A, 'short')).toBe(false);
    expect(verifyLinkSignature('tok', URL_A, '')).toBe(false);
  });

  it('puts the signature for the original target on every rewritten link', () => {
    const out = rewriteLinks(`<a href="${URL_A}">x</a>`, ORIGIN, 'tok');

    expect(out).toBe(
      `<a href="${ORIGIN}/m/c/tok?u=${encodeURIComponent(URL_A)}&s=${signLink('tok', URL_A)}">x</a>`,
    );
  });

  it('ignores an empty entry in the skip list rather than exempting every link', () => {
    const out = rewriteLinks(`<a href="${URL_A}">x</a>`, ORIGIN, 'tok', ['']);

    expect(out).toContain('/m/c/tok');
  });
});

describe('extractLinks', () => {
  it('returns every href exactly as written, in either quote style', () => {
    const html = `<a href="${URL_A}">a</a><a href='mailto:a@b.com'>b</a><a HREF = "">c</a>`;

    expect(extractLinks(html)).toEqual([URL_A, 'mailto:a@b.com', '']);
  });

  it('finds nothing in a body without links', () => {
    expect(extractLinks('<p>Plain</p>')).toEqual([]);
  });
});
