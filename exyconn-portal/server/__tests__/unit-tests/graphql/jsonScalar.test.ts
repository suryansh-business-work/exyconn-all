import { Kind, parseValue, type ValueNode } from 'graphql';
import { JSONScalar } from '../../../src/graphql/jsonScalar';

const literal = (source: string): unknown => JSONScalar.parseLiteral(parseValue(source));

describe('JSONScalar serialize and parseValue', () => {
  it('parses a string that holds JSON', () => {
    expect(JSONScalar.serialize('{"a":1,"b":[true]}')).toEqual({ a: 1, b: [true] });
    expect(JSONScalar.parseValue('[1,2]')).toEqual([1, 2]);
  });

  it('keeps a string that is not JSON as the string', () => {
    expect(JSONScalar.serialize('plain text')).toBe('plain text');
    expect(JSONScalar.parseValue('{broken')).toBe('{broken');
  });

  it('returns a JSON-safe copy of an object', () => {
    const source = { at: new Date('2026-01-02T03:04:05.000Z'), nested: { n: 1 }, gone: undefined };
    const result = JSONScalar.serialize(source) as Record<string, unknown>;
    expect(result).toEqual({ at: '2026-01-02T03:04:05.000Z', nested: { n: 1 } });
    expect(result.nested).not.toBe(source.nested);
    expect('gone' in result).toBe(false);
  });

  it('passes other primitives through', () => {
    expect(JSONScalar.serialize(7)).toBe(7);
    expect(JSONScalar.parseValue(false)).toBe(false);
    expect(JSONScalar.parseValue(null)).toBeNull();
    expect(JSONScalar.serialize(0)).toBe(0);
  });
});

describe('JSONScalar parseLiteral', () => {
  it('reads scalars written inline in a document', () => {
    expect(literal('"hello"')).toBe('hello');
    expect(literal(String.raw`"{\"k\":2}"`)).toEqual({ k: 2 });
    expect(literal('12')).toBe(12);
    expect(literal('1.5')).toBe(1.5);
    expect(literal('true')).toBe(true);
    expect(literal('null')).toBeNull();
  });

  it('reads nested objects and lists', () => {
    expect(literal('{ a: 1, b: [true, null, "x", { c: 2.5 }] }')).toEqual({
      a: 1,
      b: [true, null, 'x', { c: 2.5 }],
    });
    expect(literal('[]')).toEqual([]);
  });

  it('reads anything else (a variable, an enum) as null', () => {
    expect(literal('$input')).toBeNull();
    expect(literal('ACTIVE')).toBeNull();
    const variable: ValueNode = { kind: Kind.VARIABLE, name: { kind: Kind.NAME, value: 'v' } };
    expect(JSONScalar.parseLiteral(variable)).toBeNull();
  });
});
