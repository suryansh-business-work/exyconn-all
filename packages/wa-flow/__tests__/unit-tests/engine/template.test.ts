import { describe, expect, it } from 'vitest';
import { createDummy } from '../../../src/engine/dummy';
import { amountOf, evaluate, evaluateAll, fill, say, scopeOf } from '../../../src/engine/template';
import { makeCtx, NOW } from './fixtures';

const ctx = makeCtx();
const data = () => createDummy(11, NOW);
const DAY = 24 * 60 * 60 * 1000;

describe('scopeOf', () => {
  it('adds the signed-in user as user.* on top of the variables', () => {
    expect(scopeOf({ a: '1' }, ctx)).toEqual({
      a: '1',
      'user.firstName': 'Asha',
      'user.fullName': 'Asha Rao',
      'user.email': 'asha@example.com',
      'user.phone': '+91 98765 43210',
    });
  });
});

describe('fill', () => {
  const scope = { n: '1500', name: 'Asha', word: 'abc' };

  it('fills names and leaves unknown ones as written', () => {
    expect(fill('Hi {{ name }}, {{missing}}', scope, ctx)).toBe('Hi Asha, {{missing}}');
  });

  it('applies the formatting filters to numbers', () => {
    expect(fill('{{n|money}} {{n|date}} {{n|time}} {{n | day}}', scope, ctx)).toBe(
      'Rs 1500 date:1500 time:1500 day:1500',
    );
  });

  it('leaves non-numbers alone under number filters', () => {
    expect(fill('{{word|money}}/{{word|date}}/{{word|time}}/{{word|day}}', scope, ctx)).toBe(
      'abc/abc/abc/abc',
    );
  });

  it('changes case and ignores an unknown filter', () => {
    expect(fill('{{name|upper}} {{name|lower}} {{name|shout}}', scope, ctx)).toBe('ASHA asha Asha');
  });
});

describe('say', () => {
  it('translates the source before filling it', () => {
    const shout = makeCtx({ t: (s) => s.replace('Hello', 'Namaste') });
    expect(say('Hello {{name}}', { name: 'Hello' }, shout)).toBe('Namaste Hello');
  });
});

describe('amountOf', () => {
  it('reads numbers, templates and falls back to 0', () => {
    expect(amountOf(250, {}, ctx)).toBe(250);
    expect(amountOf('{{fee}}', { fee: '499' }, ctx)).toBe(499);
    expect(amountOf('{{fee}}', {}, ctx)).toBe(0);
  });
});

describe('evaluate', () => {
  it('returns a plain template filled', () => {
    expect(evaluate('Dr. {{doc}}', { doc: 'Rao' }, ctx, data())).toBe('Dr. Rao');
  });

  it('runs the id, price, int and pick helpers deterministically', () => {
    expect(evaluate('$id:BK', {}, ctx, data())).toBe(data().id('BK'));
    expect(evaluate('$id', {}, ctx, data())).toMatch(/^ID-/);
    expect(evaluate('$price:650', {}, ctx, data())).toBe(String(data().price(650)));
    expect(evaluate('$price:650:0', {}, ctx, data())).toBe('650');
    expect(evaluate('$int:1:9', {}, ctx, data())).toBe(String(data().int(1, 9)));
    expect(['a', 'b', 'c']).toContain(evaluate('$pick:a|b|c', {}, ctx, data()));
    expect(evaluate('$pick', {}, ctx, data())).toBe('');
  });

  it('gives local midnight for $days and the clock for $now', () => {
    expect(evaluate('$days:2', {}, ctx, data())).toBe(String(Date.UTC(2026, 9, 7) + 2 * DAY));
    expect(evaluate('$now', {}, ctx, data())).toBe(String(NOW));
  });

  it('leaves an unknown helper as written, after filling', () => {
    expect(evaluate('${{what}}', { what: 'nope:1' }, ctx, data())).toBe('$nope:1');
  });
});

describe('evaluateAll', () => {
  it('evaluates in order so later values see earlier ones', () => {
    expect(evaluateAll({ a: '{{x}}1', b: '{{a}}2' }, { x: '0' }, ctx, data())).toEqual({
      a: '01',
      b: '012',
    });
  });

  it('returns an empty map for no set', () => {
    expect(evaluateAll(undefined, {}, ctx, data())).toEqual({});
  });
});
