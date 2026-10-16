import { describe, expect, it } from 'vitest';
import type { ImportFieldOption } from '../../../src/import/import.types';
import {
  assignColumn,
  autoMap,
  buildRow,
  normaliseHeader,
  sampleValues,
  unmappedRequired,
} from '../../../src/import/mapping';

const fields: ImportFieldOption[] = [
  { key: 'name', label: 'Company name', required: true },
  { key: 'email', label: 'Email address', required: true, aliases: ['Mail'] },
  { key: 'phone', label: 'Phone', required: false },
];

describe('normaliseHeader', () => {
  it('keeps only lower-case letters and digits', () => {
    expect(normaliseHeader('E-mail Address')).toBe('emailaddress');
    expect(normaliseHeader('email_address')).toBe('emailaddress');
    expect(normaliseHeader('Line 2')).toBe('line2');
    expect(normaliseHeader(' -_ ')).toBe('');
  });
});

describe('autoMap', () => {
  it('matches headers by key, label and alias, ignoring case and punctuation', () => {
    expect(autoMap(['NAME', 'mail', 'Phone'], fields)).toEqual(['name', 'email', 'phone']);
    expect(autoMap(['company_name', 'Email-Address'], fields)).toEqual(['name', 'email']);
  });

  it('leaves blank and unknown headers unmapped', () => {
    expect(autoMap(['', 'Notes', '  '], fields)).toEqual([null, null, null]);
  });

  it('gives a field to the first column that matches it only', () => {
    expect(autoMap(['Name', 'company name'], fields)).toEqual(['name', null]);
  });

  it('falls back to synonyms, but only for fields the source has', () => {
    const synonyms = { telephone: 'phone', website: 'url' };
    expect(autoMap(['Telephone', 'Website'], fields, synonyms)).toEqual(['phone', null]);
  });
});

describe('assignColumn', () => {
  it('maps a column and takes the field from any other column', () => {
    expect(assignColumn(['name', null, 'phone'], 1, 'name')).toEqual([null, 'name', 'phone']);
  });

  it('un-maps a column without touching the others', () => {
    expect(assignColumn(['name', 'email'], 0, null)).toEqual([null, 'email']);
  });
});

describe('unmappedRequired', () => {
  it('lists the required fields no column fills', () => {
    expect(unmappedRequired(['phone', null], fields).map((field) => field.key)).toEqual([
      'name',
      'email',
    ]);
    expect(unmappedRequired(['name', 'email'], fields)).toEqual([]);
  });
});

describe('sampleValues', () => {
  const rows = [['  a '], [''], ['b'], [], ['c'], ['d']];

  it('returns the first non-empty trimmed values, up to the count', () => {
    expect(sampleValues(rows, 0)).toEqual(['a', 'b', 'c']);
    expect(sampleValues(rows, 0, 1)).toEqual(['a']);
  });

  it('returns what there is when the column has fewer values', () => {
    expect(sampleValues(rows, 0, 10)).toEqual(['a', 'b', 'c', 'd']);
    expect(sampleValues(rows, 3)).toEqual([]);
  });
});

describe('buildRow', () => {
  it('keeps mapped, non-blank cells, trimmed', () => {
    expect(buildRow([' Acme ', 'x', '   ', 'a@b.co'], ['name', null, 'phone', 'email'])).toEqual({
      name: 'Acme',
      email: 'a@b.co',
    });
  });

  it('treats a missing cell as blank', () => {
    expect(buildRow(['Acme'], ['name', 'email'])).toEqual({ name: 'Acme' });
  });
});
