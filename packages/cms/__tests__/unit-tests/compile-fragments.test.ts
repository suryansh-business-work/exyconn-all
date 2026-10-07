import { describe, it, expect } from 'vitest';
import { compileHtml } from '../../src/compile';

const compile = (html: string) => compileHtml(html, '').blocks;

describe('compileHtml: fragments', () => {
  it('turns a fragment into a reference and drops its preview content', () => {
    const html =
      '<p>a</p><exy-fragment data-fragment-id="hdr"><nav>preview</nav></exy-fragment><p>b</p>';
    expect(compile(html)).toEqual([
      { kind: 'html', html: '<p>a</p>' },
      { kind: 'fragment', fragmentId: 'hdr' },
      { kind: 'html', html: '<p>b</p>' },
    ]);
  });

  it('reads single-quoted ids and tags in any case', () => {
    expect(compile(`<EXY-FRAGMENT Data-Fragment-Id='ftr'></Exy-Fragment>`)).toEqual([
      { kind: 'fragment', fragmentId: 'ftr' },
    ]);
  });

  it('ignores components and nested fragments inside a fragment preview', () => {
    const html =
      '<exy-fragment data-fragment-id="outer"><exy-component data-key="x">' +
      '<exy-fragment data-fragment-id="inner"></exy-fragment></exy-component></exy-fragment><i>z</i>';
    expect(compile(html)).toEqual([
      { kind: 'fragment', fragmentId: 'outer' },
      { kind: 'html', html: '<i>z</i>' },
    ]);
  });

  it('does not let a self-closing fragment swallow what follows', () => {
    expect(compile('<exy-fragment data-fragment-id="a" /><p>kept</p>')).toEqual([
      { kind: 'fragment', fragmentId: 'a' },
      { kind: 'html', html: '<p>kept</p>' },
    ]);
  });

  it('ignores a stray fragment closing tag and merges the HTML around it', () => {
    expect(compile('<p>a</p></exy-fragment><p>b</p>')).toEqual([
      { kind: 'html', html: '<p>a</p><p>b</p>' },
    ]);
  });

  it('rejects a fragment that is never closed instead of dropping what follows it', () => {
    expect(() => compile('<exy-fragment data-fragment-id="a"><p>lost</p>')).toThrow(
      'A fragment is never closed.',
    );
  });
});
