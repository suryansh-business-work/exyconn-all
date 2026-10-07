import { describe, it, expect } from 'vitest';
import { compileHtml, componentPlaceholder, fragmentPlaceholder } from '../../src/compile';

function keyOf(attribute: string): string {
  const [block] = compileHtml(`<exy-component data-key=${attribute}/>`, '').blocks;
  if (block?.kind !== 'component') {
    throw new Error('expected a component');
  }
  return block.key;
}

describe('compileHtml: attribute entities', () => {
  it.each([
    ['&quot;', '"'],
    ['&#34;', '"'],
    ['&#39;', "'"],
    ['&#x27;', "'"],
    ['&apos;', "'"],
    ['&lt;', '<'],
    ['&gt;', '>'],
    ['&amp;', '&'],
  ])('decodes %s to %s', (entity, character) => {
    expect(keyOf(`"a${entity}b"`)).toBe(`a${character}b`);
  });

  it('decodes once, so an escaped entity stays literal', () => {
    expect(keyOf('"&amp;quot;"')).toBe('&quot;');
  });

  it('leaves unknown entities and bare ampersands alone', () => {
    expect(keyOf('"a&nbsp;b&c"')).toBe('a&nbsp;b&c');
  });

  it('keeps double quotes inside a single-quoted value', () => {
    expect(keyOf(`'say "hi"'`)).toBe('say "hi"');
  });
});

describe('componentPlaceholder', () => {
  it('writes the tag with escaped JSON props and the children inside', () => {
    expect(componentPlaceholder('a.b', { t: '<"&">' }, '<p>c</p>')).toBe(
      '<exy-component data-key="a.b" data-props="{&quot;t&quot;:&quot;&lt;\\&quot;&amp;\\&quot;&gt;&quot;}"><p>c</p></exy-component>',
    );
  });

  it('defaults to no children', () => {
    expect(componentPlaceholder('a', {})).toBe(
      '<exy-component data-key="a" data-props="{}"></exy-component>',
    );
  });

  it('round-trips through the compiler, including awkward text', () => {
    const props = { title: `It's <b>"bold"</b> & &amp; more`, list: [1, { x: null }], on: true };
    const html = componentPlaceholder('home.hero', props, componentPlaceholder('home.inner', {}));
    expect(compileHtml(html, '').blocks).toEqual([
      {
        kind: 'component',
        key: 'home.hero',
        props,
        children: [{ kind: 'component', key: 'home.inner', props: {}, children: [] }],
      },
    ]);
  });
});

describe('fragmentPlaceholder', () => {
  it('writes an empty fragment tag that compiles back to its id', () => {
    const html = fragmentPlaceholder('frag-1');
    expect(html).toBe('<exy-fragment data-fragment-id="frag-1"></exy-fragment>');
    expect(compileHtml(html, '').blocks).toEqual([{ kind: 'fragment', fragmentId: 'frag-1' }]);
  });
});
