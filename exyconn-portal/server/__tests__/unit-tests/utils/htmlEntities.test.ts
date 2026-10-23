import { decodeHtmlEntities } from '../../../src/utils/htmlEntities';

describe('decodeHtmlEntities', () => {
  it('decodes the named, decimal and hex entities a Gmail snippet carries', () => {
    expect(decodeHtmlEntities('you&#39;re &quot;in&quot; &amp; set&nbsp;&lt;3&gt; &APOS;')).toBe(
      'you\'re "in" & set <3> \'',
    );
    expect(decodeHtmlEntities('caf&#xE9; &#X1F600;')).toBe('café 😀');
  });

  it('decodes once, so an escaped entity stays an entity', () => {
    expect(decodeHtmlEntities('&amp;lt;b&amp;gt;')).toBe('&lt;b&gt;');
  });

  it('keeps unknown and out-of-range entities and plain ampersands as written', () => {
    expect(decodeHtmlEntities('&copy; &#0; &#x110000; Q&A &;')).toBe(
      '&copy; &#0; &#x110000; Q&A &;',
    );
  });
});
