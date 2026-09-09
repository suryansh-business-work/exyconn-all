import { extractMergeFields, renderMergeFields, toValueMap } from '../../src/utils/mergeFields';

describe('renderMergeFields', () => {
  it('substitutes a field with its value', () => {
    expect(renderMergeFields('Hi {{name}}, welcome.', { name: 'Priya' })).toBe(
      'Hi Priya, welcome.',
    );
  });

  it('tolerates whitespace inside the braces, because people type it', () => {
    expect(renderMergeFields('Hi {{  name  }}', { name: 'Priya' })).toBe('Hi Priya');
  });

  it('renders an unsupplied field as nothing, never as {{field}}', () => {
    // Leaving the braces in is the failure mode that has embarrassed every company that ever
    // shipped a mail merge.
    expect(renderMergeFields('Hi {{firstName}}!', {})).toBe('Hi !');
  });

  it('never reaches a prototype member', () => {
    // The AI module used plain property access before these two were unified, so this
    // rendered "function Object() { [native code] }" into a prompt somebody paid to run.
    // The Map of own entries is what stops it.
    expect(renderMergeFields('{{constructor}}', {})).toBe('');
    expect(renderMergeFields('{{toString}}', {})).toBe('');
    expect(renderMergeFields('{{valueOf}}', {})).toBe('');
  });

  it('does not treat {{__proto__}} as a field at all', () => {
    // A field name must START with a letter, so this never even reaches the lookup — it is
    // left as literal text, which is the safe outcome and worth pinning deliberately.
    expect(renderMergeFields('{{__proto__}}', {})).toBe('{{__proto__}}');
  });

  it('leaves anything that is not a field alone', () => {
    expect(renderMergeFields('{{ 9lives }} {{}} { name }', { name: 'x' })).toBe(
      '{{ 9lives }} {{}} { name }',
    );
  });
});

describe('extractMergeFields', () => {
  it('lists each distinct field once, in first-appearance order', () => {
    expect(extractMergeFields('{{b}} {{a}} {{b}}')).toEqual(['b', 'a']);
  });

  it('finds nothing in a template with no fields', () => {
    expect(extractMergeFields('plain text')).toEqual([]);
  });
});

describe('toValueMap', () => {
  it('turns the wire shape into a lookup, last value winning', () => {
    expect(
      toValueMap([
        { name: 'a', value: '1' },
        { name: 'a', value: '2' },
      ]),
    ).toEqual({ a: '2' });
  });

  it('treats an absent value as empty rather than undefined', () => {
    expect(toValueMap([{ name: 'a' } as { name: string; value: string }])).toEqual({ a: '' });
  });

  it('has nothing to map when no variables were sent', () => {
    expect(toValueMap()).toEqual({});
  });
});
