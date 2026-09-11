import { describe, expect, it } from 'vitest';
import {
  HEIGHT_REPORTER,
  consentDocument,
  linkAction,
  parseHeight,
} from '../../../src/lib/consent/consent-document';

const PALETTE = { ink: 'INK', muted: 'MUTED', hairline: 'HAIRLINE', link: 'LINK' };

describe('consentDocument', () => {
  const page = consentDocument('<p>We record <strong>time</strong>.</p>', PALETTE);

  it('carries the disclosure verbatim', () => {
    expect(page).toContain('<p>We record <strong>time</strong>.</p>');
  });

  it('forbids every script, frame and form before the disclosure begins', () => {
    const policy = page.indexOf('Content-Security-Policy');
    expect(policy).toBeGreaterThan(-1);
    expect(policy).toBeLessThan(page.indexOf('We record'));
    expect(page).toContain("default-src 'none'");
    expect(page).toContain("form-action 'none'");
    expect(page).toContain("base-uri 'none'");
    expect(page).not.toContain('script-src');
  });

  it('paints the text in the theme it is given', () => {
    expect(page).toContain('color: INK');
    expect(page).toContain('a { color: LINK; }');
    expect(page).toContain('solid HAIRLINE');
  });

  it('scales the text with the reader’s own setting', () => {
    expect(page).toContain('font-size: 16px');
    expect(consentDocument('', PALETTE, 1.5)).toContain('font-size: 24px');
  });

  it('measures the same wrapper the height reporter reads', () => {
    expect(page).toContain('<div id="exyconn-consent">');
    expect(HEIGHT_REPORTER).toContain("getElementById('exyconn-consent')");
    expect(HEIGHT_REPORTER).toContain('ReactNativeWebView.postMessage');
  });
});

describe('parseHeight', () => {
  it('reads a reported height', () => {
    expect(parseHeight('412')).toBe(412);
  });

  it('ignores anything that is not a usable height', () => {
    expect(parseHeight('')).toBeNull();
    expect(parseHeight('0')).toBeNull();
    expect(parseHeight('-3')).toBeNull();
    expect(parseHeight('tall')).toBeNull();
    expect(parseHeight('Infinity')).toBeNull();
  });
});

describe('linkAction', () => {
  it('keeps the document, and jumps within it, in the view', () => {
    expect(linkAction('about:blank', false)).toBe('stay');
    expect(linkAction('about:blank#section-2', true)).toBe('stay');
  });

  it('sends a tapped web or mail link to the system browser', () => {
    expect(linkAction('https://exyconn.com/privacy', true)).toBe('browser');
    expect(linkAction('HTTP://exyconn.com', true)).toBe('browser');
    expect(linkAction('mailto:hr@exyconn.com', true)).toBe('browser');
  });

  it('refuses a navigation nobody tapped for, such as a meta refresh', () => {
    expect(linkAction('https://exyconn.com', false)).toBe('block');
  });

  it('refuses every other scheme, tapped or not', () => {
    expect(linkAction('javascript:alert(1)', true)).toBe('block');
    expect(linkAction('intent://scan#Intent;end', true)).toBe('block');
    expect(linkAction('file:///etc/hosts', true)).toBe('block');
    expect(linkAction('data:text/html,hi', true)).toBe('block');
    expect(linkAction('about:srcdoc', true)).toBe('block');
    expect(linkAction('no-scheme', true)).toBe('block');
  });
});
