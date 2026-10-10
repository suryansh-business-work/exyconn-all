import { describe, expect, it } from 'vitest';
import {
  componentHtml,
  fragmentHtml,
  parseProps,
  propsSummary,
} from '../../../src/cms/placeholders';

describe('parseProps', () => {
  it('treats a missing, non-string or blank value as empty props', () => {
    expect(parseProps(undefined)).toEqual({});
    expect(parseProps(42)).toEqual({});
    expect(parseProps('   ')).toEqual({});
  });

  it('returns a JSON object as props', () => {
    expect(parseProps('{"title":"Hi","count":2}')).toEqual({ title: 'Hi', count: 2 });
  });

  it('returns null for JSON that is not an object', () => {
    expect(parseProps('null')).toBeNull();
    expect(parseProps('[1,2]')).toBeNull();
    expect(parseProps('"text"')).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseProps('{title:')).toBeNull();
  });
});

describe('componentHtml', () => {
  it('writes valid props through the shared placeholder, with children', () => {
    expect(componentHtml('hero', '{"title":"A & B"}', '<p>x</p>')).toBe(
      '<exy-component data-key="hero" data-props="{&quot;title&quot;:&quot;A &amp; B&quot;}"><p>x</p></exy-component>',
    );
  });

  it('writes empty props when the attribute is missing', () => {
    expect(componentHtml('faq', undefined, '')).toBe(
      '<exy-component data-key="faq" data-props="{}"></exy-component>',
    );
  });

  it('keeps invalid props as they were, escaping the key and the raw value', () => {
    expect(componentHtml('a"<b>', '{"x":<1>&', '')).toBe(
      '<exy-component data-key="a&quot;&lt;b&gt;" data-props="{&quot;x&quot;:&lt;1&gt;&amp;"></exy-component>',
    );
  });
});

describe('fragmentHtml', () => {
  it('writes the fragment placeholder for an id', () => {
    expect(fragmentHtml('frag-1')).toBe('<exy-fragment data-fragment-id="frag-1"></exy-fragment>');
  });
});

describe('propsSummary', () => {
  it('explains props that are not valid JSON', () => {
    expect(propsSummary(null)).toBe('Settings are not valid JSON: open the settings to fix them.');
  });

  it('says "Default settings" when nothing is describable', () => {
    expect(propsSummary({})).toBe('Default settings');
    expect(propsSummary({ blank: '  <br/> ', nested: { a: 1 }, none: null })).toBe(
      'Default settings',
    );
  });

  it('strips tags, collapses whitespace and describes numbers and booleans', () => {
    expect(propsSummary({ title: '<b>Big</b>\n\n  news', count: 3, live: false })).toBe(
      'title: Big news · count: 3 · live: false',
    );
  });

  it('keeps text after a "<" that never closes', () => {
    expect(propsSummary({ note: 'a <b>bold</b> and 1 < 2' })).toBe('note: a bold and 1 < 2');
  });

  it('counts array items with the right plural', () => {
    expect(propsSummary({ one: ['a'], many: ['a', 'b'], none: [] })).toBe(
      'one: 1 item · many: 2 items · none: 0 items',
    );
  });

  it('cuts long text at 48 characters with an ellipsis and keeps exactly 48', () => {
    const exact = 'x'.repeat(48);
    expect(propsSummary({ text: exact })).toBe(`text: ${exact}`);
    expect(propsSummary({ text: `${exact}y` })).toBe(`text: ${exact}…`);
  });

  it('stops after three described props', () => {
    expect(propsSummary({ a: 1, skip: null, b: 2, c: 3, d: 4 })).toBe('a: 1 · b: 2 · c: 3');
  });
});
