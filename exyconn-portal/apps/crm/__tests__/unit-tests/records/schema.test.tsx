import { describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import {
  CrmObject,
  CrmObjectSchemaDocument,
  CrmPropertyType,
} from '@exyconn/shell/graphql/generated';
import {
  CHOICE_TYPES,
  displayValue,
  fileNameOf,
  optionLabel,
  recordFields,
  scalarText,
  useObjectSchema,
  valueOf,
  type ValueFormatters,
} from '../../../src/records/schema';
import { propertyLabel, PROPERTY_TYPE_LABEL } from '../../../src/records/propertyText';
import { renderHookWithProviders } from '../test-utils';
import { choiceProperty, property, recordRow } from './records-fixtures';

const FORMATTERS: ValueFormatters = {
  formatDate: (value) => `date(${String(value)})`,
  formatNumber: (value) => `num(${value})`,
  yes: 'Ja',
  no: 'Nein',
};

describe('scalarText', () => {
  it('keeps strings and writes numbers, booleans and bigints as text', () => {
    expect(scalarText('Acme')).toBe('Acme');
    expect(scalarText(42)).toBe('42');
    expect(scalarText(false)).toBe('false');
    expect(scalarText(10n)).toBe('10');
  });

  it('writes structured values as JSON instead of [object Object]', () => {
    expect(scalarText({ a: 1 })).toBe('{"a":1}');
    expect(scalarText(null)).toBe('null');
  });

  it('is empty for values JSON cannot represent', () => {
    expect(scalarText(undefined)).toBe('');
    expect(scalarText(() => 1)).toBe('');
  });
});

describe('record schema helpers', () => {
  it('names the choice types', () => {
    expect(CHOICE_TYPES.has(CrmPropertyType.Radio)).toBe(true);
    expect(CHOICE_TYPES.has(CrmPropertyType.Text)).toBe(false);
  });

  it('reads the decoded file name from an address, ignoring the query string', () => {
    expect(fileNameOf('https://cdn.io/a/My%20Deck.pdf?tr=1')).toBe('My Deck.pdf');
    expect(fileNameOf('plain.txt')).toBe('plain.txt');
  });

  it('leaves the filter-only properties out of the record fields', () => {
    const kept = property({ key: 'email' });
    expect(recordFields([kept, property({ key: 'hasEmail', filterOnly: true })])).toEqual([kept]);
  });

  it('reads built-in values from the row and custom ones from custom', () => {
    const row = recordRow({ name: 'Asha', custom: { tier: 'Gold' } });
    expect(valueOf(row, property())).toBe('Asha');
    expect(valueOf(row, property({ key: 'tier', builtIn: false }))).toBe('Gold');
    expect(valueOf(recordRow(), property({ key: 'tier', builtIn: false }))).toBeUndefined();
  });

  it('labels a listed option and falls back to the stored value', () => {
    const stage = choiceProperty({ NEW: 'New' });
    expect(optionLabel(stage, 'NEW')).toBe('New');
    expect(optionLabel(stage, 'GONE')).toBe('GONE');
  });
});

describe('displayValue', () => {
  it('is empty for blank values', () => {
    for (const blank of [null, undefined, '']) {
      expect(displayValue(property(), blank, FORMATTERS)).toBe('');
    }
  });

  it('labels single and multiple choices', () => {
    const options = { A: 'Alpha', B: 'Beta' };
    expect(displayValue(choiceProperty(options), 'A', FORMATTERS)).toBe('Alpha');
    const radio = choiceProperty(options, { type: CrmPropertyType.Radio });
    expect(displayValue(radio, 'B', FORMATTERS)).toBe('Beta');
    const multi = choiceProperty(options, { type: CrmPropertyType.MultiSelect });
    expect(displayValue(multi, ['A', 'B'], FORMATTERS)).toBe('Alpha, Beta');
    expect(displayValue(multi, 'A', FORMATTERS)).toBe('Alpha');
  });

  it('shows a file by name, a boolean as Yes/No and a date through the formatter', () => {
    const file = property({ type: CrmPropertyType.File });
    expect(displayValue(file, 'https://cdn.io/x/cv.pdf', FORMATTERS)).toBe('cv.pdf');
    const flag = property({ type: CrmPropertyType.Boolean });
    expect(displayValue(flag, true, FORMATTERS)).toBe('Ja');
    expect(displayValue(flag, false, FORMATTERS)).toBe('Nein');
    const date = property({ type: CrmPropertyType.Date });
    expect(displayValue(date, '2026-10-15', FORMATTERS)).toBe('date(2026-10-15)');
    const day = new Date(2026, 9, 15);
    const formatDate = vi.fn(() => 'formatted');
    expect(displayValue(date, day, { ...FORMATTERS, formatDate })).toBe('formatted');
    expect(formatDate).toHaveBeenCalledWith(day);
  });

  it('formats numbers and passes non-numeric text through', () => {
    const number = property({ type: CrmPropertyType.Number });
    expect(displayValue(number, 7, FORMATTERS)).toBe('num(7)');
    expect(displayValue(number, 'n/a', FORMATTERS)).toBe('n/a');
  });

  it('writes other values as text', () => {
    expect(displayValue(property(), 'Asha', FORMATTERS)).toBe('Asha');
    expect(displayValue(property(), { a: 1 }, FORMATTERS)).toBe('{"a":1}');
  });
});

describe('propertyText', () => {
  it('translates built-in labels and shows custom labels as typed', () => {
    const t = vi.fn((text: string) => `T:${text}`);
    expect(propertyLabel(t as never, property())).toBe('T:Name');
    expect(propertyLabel(t as never, property({ builtIn: false, label: 'Tier' }))).toBe('Tier');
    expect(PROPERTY_TYPE_LABEL[CrmPropertyType.MultiSelect]).toBe('Multi-select');
  });
});

describe('useObjectSchema', () => {
  it('is empty until the schema answers', () => {
    const { result } = renderHookWithProviders(() => useObjectSchema(CrmObject.Lead));
    expect(result.current.properties).toEqual([]);
    expect(result.current.fields).toEqual([]);
    expect(result.current.dedupeKey).toBe('');
  });

  it('returns every property and the record fields once the schema answers', async () => {
    const name = property();
    const hasEmail = property({ key: 'hasEmail', filterOnly: true });
    const mocks = [
      {
        request: { query: CrmObjectSchemaDocument, variables: { object: CrmObject.Lead } },
        result: {
          data: {
            crmObjectSchema: {
              __typename: 'CrmObjectSchema',
              object: CrmObject.Lead,
              dedupeKey: 'email',
              properties: [name, hasEmail],
            },
          },
        },
      },
    ];
    const { result } = renderHookWithProviders(() => useObjectSchema(CrmObject.Lead), { mocks });
    await waitFor(() => expect(result.current.properties).toHaveLength(2));
    expect(result.current.fields.map((one) => one.key)).toEqual(['name']);
    expect(result.current.dedupeKey).toBe('email');
  });
});
