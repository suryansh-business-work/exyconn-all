import { describe, expect, it } from 'vitest';
import { LOG_LIMITS, describeValue } from '../../src';
import { contextText, cut, isErrorLike, stringify } from '../../src/describe';

describe('isErrorLike', () => {
  it('accepts anything with a string message, Error or not', () => {
    expect(isErrorLike(new Error('x'))).toBe(true);
    expect(isErrorLike({ message: 'bridged' })).toBe(true);
  });

  it('rejects primitives, null and objects without a string message', () => {
    expect(isErrorLike('boom')).toBe(false);
    expect(isErrorLike(null)).toBe(false);
    expect(isErrorLike(undefined)).toBe(false);
    expect(isErrorLike({ message: 42 })).toBe(false);
    expect(isErrorLike({})).toBe(false);
  });
});

describe('cut', () => {
  it('turns missing or empty text into null', () => {
    expect(cut(null, 10)).toBeNull();
    expect(cut(undefined, 10)).toBeNull();
    expect(cut('', 10)).toBeNull();
  });

  it('keeps text at the limit and trims text past it', () => {
    expect(cut('abcde', 5)).toBe('abcde');
    expect(cut('abcdef', 5)).toBe('abcde');
  });
});

describe('stringify', () => {
  it('returns strings untouched and everything else as JSON', () => {
    expect(stringify('plain "text"')).toBe('plain "text"');
    expect(stringify({ a: 1 })).toBe('{"a":1}');
    expect(stringify(7)).toBe('7');
    expect(stringify(null)).toBe('null');
  });

  it('falls back to the type name when JSON has nothing to say', () => {
    expect(stringify(undefined)).toBe('undefined');
    expect(stringify(() => 1)).toBe('function');
    expect(stringify(Symbol('s'))).toBe('symbol');
  });

  it('labels values JSON cannot serialize instead of throwing', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(stringify(circular)).toBe('[unserializable object]');
    expect(stringify(10n)).toBe('[unserializable bigint]');
  });
});

describe('describeValue', () => {
  it('takes the message, name and stack of an error', () => {
    const error = new RangeError('out of range');
    expect(describeValue(error)).toEqual({
      text: 'out of range',
      errorName: 'RangeError',
      stack: error.stack,
    });
  });

  it('drops a name or stack that is not text', () => {
    expect(describeValue({ message: 'bridged', name: 5, stack: { frames: [] } })).toEqual({
      text: 'bridged',
      errorName: null,
      stack: null,
    });
  });

  it('describes a thrown non-error as text with no name or stack', () => {
    expect(describeValue('just a string')).toEqual({
      text: 'just a string',
      errorName: null,
      stack: null,
    });
    expect(describeValue({ code: 404 })).toEqual({
      text: '{"code":404}',
      errorName: null,
      stack: null,
    });
  });
});

describe('contextText', () => {
  it('is null when there is no context or it is empty', () => {
    expect(contextText(undefined)).toBeNull();
    expect(contextText({})).toBeNull();
  });

  it('serializes the context and cuts it to the limit', () => {
    expect(contextText({ field: 'timezone' })).toBe('{"field":"timezone"}');
    const long = contextText({ blob: 'x'.repeat(LOG_LIMITS.context * 2) });
    expect(long).toHaveLength(LOG_LIMITS.context);
    expect(long?.startsWith('{"blob":"xxx')).toBe(true);
  });
});
