import {
  bareDomain,
  coerceValue,
  isBlank,
  isDomainName,
} from '../../../../../src/modules/crm/records/crm.values';
import type { PropertyDef, PropertyType } from '../../../../../src/modules/crm/records/crm.objects';

const prop = (type: PropertyType, overrides: Partial<PropertyDef> = {}): PropertyDef => ({
  key: 'field',
  label: 'Field',
  type,
  options: [],
  required: false,
  builtIn: false,
  path: 'custom.field',
  importable: true,
  description: '',
  filterOnly: false,
  ...overrides,
});

const TIERS = [
  { value: 'GOLD', label: 'Gold tier' },
  { value: 'SILVER', label: 'Silver tier' },
  { value: 'BRONZE', label: 'Bronze tier' },
];

describe('isBlank', () => {
  it.each([null, undefined, '', '   \t'])('treats %p as blank', (raw) => {
    expect(isBlank(raw)).toBe(true);
  });

  it.each([0, false, 'x', ' a ', []])('keeps %p as a value', (raw) => {
    expect(isBlank(raw)).toBe(false);
  });
});

describe('isDomainName', () => {
  it.each(['acme.com', 'acme.co.in', 'my-shop.io', 'a1.b2', `${'a'.repeat(63)}.com`])(
    'accepts %s',
    (value) => {
      expect(isDomainName(value)).toBe(true);
    },
  );

  it.each([
    ['a single label', 'localhost'],
    ['an empty label', 'acme..com'],
    ['a label over 63 characters', `${'a'.repeat(64)}.com`],
    ['a leading hyphen', '-acme.com'],
    ['a trailing hyphen', 'acme-.com'],
    ['an uppercase letter', 'Acme.com'],
    ['an underscore', 'my_shop.com'],
    ['a character past z', 'acme~.com'],
    ['a sign before the digits', 'acme+.com'],
  ])('refuses %s', (_why, value) => {
    expect(isDomainName(value)).toBe(false);
  });
});

describe('bareDomain', () => {
  it.each([
    ['https://www.Acme.com/about', 'acme.com'],
    ['  HTTP://shop.acme.com?x=1  ', 'shop.acme.com'],
    ['acme.com#top', 'acme.com'],
    ['www.acme.io', 'acme.io'],
    ['acme.org', 'acme.org'],
  ])('reads %p as %p', (raw, expected) => {
    expect(bareDomain(raw)).toBe(expected);
  });
});

describe('coerceValue — blanks and text', () => {
  it('reads a blank of any type as null', () => {
    expect(coerceValue(prop('NUMBER'), '  ')).toEqual({ ok: true, value: null });
    expect(coerceValue(prop('ENUM'), null)).toEqual({ ok: true, value: null });
  });

  it('trims plain text and refuses text over 10,000 characters', () => {
    expect(coerceValue(prop('TEXT'), '  hello  ')).toEqual({ ok: true, value: 'hello' });
    expect(coerceValue(prop('TEXTAREA'), 'x'.repeat(10_000))).toMatchObject({ ok: true });
    expect(coerceValue(prop('TEXT'), 'x'.repeat(10_001))).toEqual({
      ok: false,
      error: 'Field is longer than 10000 characters',
    });
  });

  it('lowercases an email and refuses one that is not an address', () => {
    expect(coerceValue(prop('EMAIL'), ' Ravi@Acme.COM ')).toEqual({
      ok: true,
      value: 'ravi@acme.com',
    });
    expect(coerceValue(prop('EMAIL'), 'ravi at acme')).toEqual({
      ok: false,
      error: 'Field "ravi at acme" is not an email address',
    });
  });

  it('reads a built-in URL as a bare domain, and refuses one that is not a domain', () => {
    const domain = prop('URL', { builtIn: true, label: 'Domain' });
    expect(coerceValue(domain, 'https://www.acme.com/team')).toEqual({
      ok: true,
      value: 'acme.com',
    });
    expect(coerceValue(domain, 'not a site')).toEqual({
      ok: false,
      error: 'Domain "not a site" is not a domain',
    });
  });

  it('keeps a custom URL exactly as typed', () => {
    expect(coerceValue(prop('URL'), ' https://acme.com/Pricing ')).toEqual({
      ok: true,
      value: 'https://acme.com/Pricing',
    });
  });

  it('stores a phone as trimmed text', () => {
    expect(coerceValue(prop('PHONE'), ' +91 98765 43210 ')).toEqual({
      ok: true,
      value: '+91 98765 43210',
    });
  });
});

describe('coerceValue — numbers', () => {
  it('keeps a number and strips separators and currency signs from text', () => {
    expect(coerceValue(prop('NUMBER'), 42)).toEqual({ ok: true, value: 42 });
    expect(coerceValue(prop('NUMBER'), '₹ 1,20,000')).toEqual({ ok: true, value: 120_000 });
    expect(coerceValue(prop('NUMBER'), '$3.5')).toEqual({ ok: true, value: 3.5 });
    expect(coerceValue(prop('NUMBER'), '-7')).toEqual({ ok: true, value: -7 });
  });

  it('refuses text and infinities', () => {
    expect(coerceValue(prop('NUMBER'), 'ten')).toEqual({
      ok: false,
      error: 'Field "ten" is not a number',
    });
    expect(coerceValue(prop('NUMBER'), Infinity)).toEqual({
      ok: false,
      error: 'Field "Infinity" is not a number',
    });
  });
});

describe('coerceValue — dates', () => {
  const dateProp = prop('DATE', { label: 'Signed' });

  it('keeps a valid Date and refuses an invalid one', () => {
    const when = new Date('2026-10-15T00:00:00.000Z');
    expect(coerceValue(dateProp, when)).toEqual({ ok: true, value: when });
    expect(coerceValue(dateProp, new Date('nope'))).toEqual({
      ok: false,
      error: 'Signed is not a date',
    });
  });

  it.each([
    ['2026-10-15', '2026-10-15T00:00:00.000Z'],
    ['2026-10-15T10:30:00Z', '2026-10-15T10:30:00.000Z'],
    ['2026-10-15T10:30:00.250Z', '2026-10-15T10:30:00.250Z'],
    ['2026-10-15T16:00:00+05:30', '2026-10-15T10:30:00.000Z'],
    ['2026-10-15T05:00:00-05:30', '2026-10-15T10:30:00.000Z'],
    ['  2026-10-15  ', '2026-10-15T00:00:00.000Z'],
  ])('reads the ISO shape %p', (raw, iso) => {
    const result = coerceValue(dateProp, raw);
    expect(result.ok).toBe(true);
    expect(result.ok && (result.value as Date).toISOString()).toBe(iso);
  });

  it.each([
    '2026-10-15T10:30',
    '2026-10-15 10:30:00',
    '2026-10-15T10:30:00+0530',
    '2026-10-15T10:30:00.5',
  ])('reads the date-time %p (local or compact zone)', (raw) => {
    expect(coerceValue(dateProp, raw)).toMatchObject({ ok: true });
  });

  it.each([
    '15/10/2026',
    'Oct 15 2026',
    '2026-1-5',
    '20261015',
    '2026-10-15T',
    '2026-10-15X10:30',
    '2026-10-15T10:30Zjunk',
    '2026-10-15T10:30+5:30',
    '2026-10-15T10:30+05:3',
    '2026-10-15Z',
    '12026-10-15',
    '2026-10-155',
    '2026-13-45',
  ])('refuses %p with an example of a date', (raw) => {
    expect(coerceValue(dateProp, raw)).toEqual({
      ok: false,
      error: `Signed "${raw}" is not a date; use a date like 2026-10-15`,
    });
  });
});

describe('coerceValue — choices', () => {
  it('matches a choice by value or label, ignoring case, and stores its value', () => {
    expect(coerceValue(prop('ENUM', { options: TIERS }), 'gold')).toEqual({
      ok: true,
      value: 'GOLD',
    });
    expect(coerceValue(prop('RADIO', { options: TIERS }), ' silver TIER ')).toEqual({
      ok: true,
      value: 'SILVER',
    });
  });

  it('names the allowed labels when nothing matches', () => {
    expect(coerceValue(prop('ENUM', { options: TIERS, label: 'Tier' }), ' Platinum ')).toEqual({
      ok: false,
      error: 'Tier "Platinum" is not one of: Gold tier, Silver tier, Bronze tier',
    });
  });

  it('reads several choices from a list or a CSV cell, in the property order', () => {
    const multi = prop('MULTI_SELECT', { options: TIERS });
    expect(coerceValue(multi, ['Bronze tier', 'gold', ''])).toEqual({
      ok: true,
      value: ['GOLD', 'BRONZE'],
    });
    expect(coerceValue(multi, 'bronze; silver,  ,gold;bronze')).toEqual({
      ok: true,
      value: ['GOLD', 'SILVER', 'BRONZE'],
    });
  });

  it('refuses the whole multi-select when one part is not a choice', () => {
    expect(coerceValue(prop('MULTI_SELECT', { options: TIERS }), 'gold; tin')).toEqual({
      ok: false,
      error: 'Field "tin" is not one of: Gold tier, Silver tier, Bronze tier',
    });
  });
});

describe('coerceValue — yes/no and files', () => {
  it.each([
    [true, true],
    [false, false],
    ['Yes', true],
    [' y ', true],
    ['TRUE', true],
    ['1', true],
    ['no', false],
    ['N', false],
    ['false', false],
    [0, false],
  ])('reads %p as %p', (raw, value) => {
    expect(coerceValue(prop('BOOLEAN'), raw)).toEqual({ ok: true, value });
  });

  it('refuses a word that is neither yes nor no', () => {
    expect(coerceValue(prop('BOOLEAN', { label: 'Opted in' }), 'maybe')).toEqual({
      ok: false,
      error: 'Opted in "maybe" is not yes or no',
    });
  });

  it('accepts an https upload address of up to 2000 characters', () => {
    const url = `https://ik.imagekit.io/${'a'.repeat(1977)}`;
    expect(url).toHaveLength(2000);
    expect(coerceValue(prop('FILE'), ` ${url} `)).toEqual({ ok: true, value: url });
  });

  it.each(['http://files.example.com/a.pdf', 'contract.pdf', `https://x.io/${'a'.repeat(1988)}`])(
    'refuses %p as a file',
    (raw) => {
      expect(coerceValue(prop('FILE', { label: 'Contract' }), raw)).toEqual({
        ok: false,
        error: 'Contract must be an uploaded file',
      });
    },
  );
});
