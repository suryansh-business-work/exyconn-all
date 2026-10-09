import { describe, expect, it } from 'vitest';
import { escapeAttribute, escapeText, serializeJsonLd } from '../../src';

describe('escapeAttribute', () => {
  it('encodes every character that could end or break an attribute', () => {
    expect(escapeAttribute(`a&b<c>d"e'f`)).toBe('a&amp;b&lt;c&gt;d&quot;e&#39;f');
  });

  it('leaves ordinary text, dashes and unicode untouched', () => {
    expect(escapeAttribute('Merge PDF — free ₹ tool')).toBe('Merge PDF — free ₹ tool');
  });
});

describe('escapeText', () => {
  it('encodes markup characters but keeps quotes readable', () => {
    expect(escapeText(`<b>"Q&A"</b>`)).toBe('&lt;b&gt;"Q&amp;A"&lt;/b&gt;');
  });
});

describe('serializeJsonLd', () => {
  it('cannot be broken out of with </script> or an HTML comment', () => {
    const json = serializeJsonLd({ name: '</script><script>alert(1)</script><!--' });
    expect(json).not.toMatch(/[<>]/);
    expect(json).toContain(String.raw`\u003c/script\u003e`);
  });

  it('escapes ampersands and the JS line separators', () => {
    const json = serializeJsonLd({ text: 'a&b\u2028c\u2029d' });
    expect(json).toBe(String.raw`{"text":"a\u0026b\u2028c\u2029d"}`);
  });

  it('still parses back to the same data', () => {
    const data = { name: '<Tools & "More">', list: ['\u2028'] };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });
});
