import { describe, it, expect } from 'vitest';
import { compileHtml } from '../../src/compile';

const compile = (html: string) => compileHtml(html, '').blocks;

describe('compileHtml: plain HTML', () => {
  it('returns no blocks for empty input and passes the CSS through', () => {
    expect(compileHtml('', '.a{color:red}')).toEqual({ blocks: [], css: '.a{color:red}' });
  });

  it('drops HTML that is only whitespace', () => {
    expect(compile('  \n\t ')).toEqual([]);
  });

  it('keeps HTML without placeholders as one html block, untouched', () => {
    expect(compile('<p class="x">Hi &amp; bye</p>')).toEqual([
      { kind: 'html', html: '<p class="x">Hi &amp; bye</p>' },
    ]);
  });

  it('splits HTML around a component into an unbalanced before and after segment', () => {
    expect(compile('<div><exy-component data-key="home.hero"></exy-component></div>')).toEqual([
      { kind: 'html', html: '<div>' },
      { kind: 'component', key: 'home.hero', props: {}, children: [] },
      { kind: 'html', html: '</div>' },
    ]);
  });

  it('drops blank HTML between placeholders', () => {
    const html = '<exy-component data-key="a"/>\n  <exy-component data-key="b"/>';
    expect(compile(html).map((block) => block.kind)).toEqual(['component', 'component']);
  });
});

describe('compileHtml: components', () => {
  it('reads the key and props from double-quoted attributes', () => {
    const html =
      '<exy-component data-key="home.hero" data-props="{&quot;title&quot;:&quot;Hi&quot;}"></exy-component>';
    expect(compile(html)).toEqual([
      { kind: 'component', key: 'home.hero', props: { title: 'Hi' }, children: [] },
    ]);
  });

  it('reads single-quoted attributes, with spaces around "="', () => {
    const html = `<exy-component data-key = 'home.hero' data-props='{"n":2}'></exy-component>`;
    expect(compile(html)).toEqual([
      { kind: 'component', key: 'home.hero', props: { n: 2 }, children: [] },
    ]);
  });

  it('matches tag and attribute names in any case', () => {
    const html = '<EXY-Component DATA-KEY="x.y" Data-Props="{}"></Exy-COMPONENT>';
    expect(compile(html)).toEqual([{ kind: 'component', key: 'x.y', props: {}, children: [] }]);
  });

  it('treats an empty data-props as no props', () => {
    expect(compile('<exy-component data-key="a" data-props=""/>')).toEqual([
      { kind: 'component', key: 'a', props: {}, children: [] },
    ]);
  });

  it('nests children (HTML, components, fragments) inside a container', () => {
    const html =
      '<exy-component data-key="home.stage"><p>a</p><exy-component data-key="home.hero"></exy-component>' +
      '<exy-fragment data-fragment-id="f1"></exy-fragment></exy-component><p>after</p>';
    expect(compile(html)).toEqual([
      {
        kind: 'component',
        key: 'home.stage',
        props: {},
        children: [
          { kind: 'html', html: '<p>a</p>' },
          { kind: 'component', key: 'home.hero', props: {}, children: [] },
          { kind: 'fragment', fragmentId: 'f1' },
        ],
      },
      { kind: 'html', html: '<p>after</p>' },
    ]);
  });

  it('does not open a self-closing component, so the next sibling is not its child', () => {
    const html = '<exy-component data-key="a" /><exy-component data-key="b"></exy-component>';
    expect(compile(html)).toEqual([
      { kind: 'component', key: 'a', props: {}, children: [] },
      { kind: 'component', key: 'b', props: {}, children: [] },
    ]);
  });

  it('does not treat a longer custom tag as a placeholder', () => {
    expect(compile('<exy-components data-key="a"></exy-components>')).toEqual([
      { kind: 'html', html: '<exy-components data-key="a"></exy-components>' },
    ]);
  });
});
