import { describe, expect, it } from 'vitest';
import { CrmPropertyType } from '@exyconn/shell/graphql/generated';
import {
  CUSTOM_FIELD_MESSAGES,
  customDefaults,
  customFieldsSchema,
  toCustomInput,
  type CustomPropertyDef,
} from '../../../../src/records/custom-fields';

function def(type: CrmPropertyType, overrides: Partial<CustomPropertyDef> = {}): CustomPropertyDef {
  return { key: 'field', label: 'Field', type, options: [], required: false, description: '', ...overrides };
}

const OPTIONS = [
  { __typename: 'CrmPropertyOption' as const, value: 'A', label: 'Alpha' },
  { __typename: 'CrmPropertyOption' as const, value: 'B', label: 'Beta' },
];

/** The first message the schema gives for one property and value, or null when it passes. */
function messageFor(property: CustomPropertyDef, value: string): string | null {
  const result = customFieldsSchema([property]).safeParse({ [property.key]: value });
  return result.success ? null : result.error.issues[0].message;
}

describe('customFieldsSchema', () => {
  it('lets an optional field stay blank and makes a required one say so', () => {
    expect(messageFor(def(CrmPropertyType.Text), '  ')).toBeNull();
    expect(messageFor(def(CrmPropertyType.Text, { required: true }), ' ')).toBe(
      CUSTOM_FIELD_MESSAGES.required,
    );
  });

  it('caps text at 10,000 characters', () => {
    expect(messageFor(def(CrmPropertyType.Textarea), 'x'.repeat(10_000))).toBeNull();
    expect(messageFor(def(CrmPropertyType.Textarea), 'x'.repeat(10_001))).toBe(
      CUSTOM_FIELD_MESSAGES.tooLong,
    );
  });

  it('checks emails, phones and web addresses against the shared patterns', () => {
    expect(messageFor(def(CrmPropertyType.Email), 'name@company.com')).toBeNull();
    expect(messageFor(def(CrmPropertyType.Email), 'name@')).toBe(CUSTOM_FIELD_MESSAGES.email);
    expect(messageFor(def(CrmPropertyType.Phone), '+91 98765 43210')).toBeNull();
    expect(messageFor(def(CrmPropertyType.Phone), 'call me')).toBe(CUSTOM_FIELD_MESSAGES.phone);
    expect(messageFor(def(CrmPropertyType.Url), 'https://acme.io')).toBeNull();
    expect(messageFor(def(CrmPropertyType.Url), 'acme')).toBe(CUSTOM_FIELD_MESSAGES.url);
  });

  it('accepts finite numbers only', () => {
    expect(messageFor(def(CrmPropertyType.Number), '-12.5')).toBeNull();
    expect(messageFor(def(CrmPropertyType.Number), 'twelve')).toBe(CUSTOM_FIELD_MESSAGES.number);
    expect(messageFor(def(CrmPropertyType.Number), 'Infinity')).toBe(CUSTOM_FIELD_MESSAGES.number);
  });

  it('accepts only listed choices for dropdowns, radios and multi-selects', () => {
    const options = { options: OPTIONS };
    expect(messageFor(def(CrmPropertyType.Enum, options), 'A')).toBeNull();
    expect(messageFor(def(CrmPropertyType.Enum, options), 'Z')).toBe(CUSTOM_FIELD_MESSAGES.choice);
    expect(messageFor(def(CrmPropertyType.Radio, options), 'Z')).toBe(CUSTOM_FIELD_MESSAGES.choice);
    expect(messageFor(def(CrmPropertyType.MultiSelect, options), 'A\nB')).toBeNull();
    expect(messageFor(def(CrmPropertyType.MultiSelect, options), 'A\nZ')).toBe(
      CUSTOM_FIELD_MESSAGES.choice,
    );
  });

  it('accepts Yes/No as true or false', () => {
    expect(messageFor(def(CrmPropertyType.Boolean), 'false')).toBeNull();
    expect(messageFor(def(CrmPropertyType.Boolean), 'maybe')).toBe(CUSTOM_FIELD_MESSAGES.choice);
  });

  it('accepts an uploaded file address only', () => {
    expect(messageFor(def(CrmPropertyType.File), 'https://cdn.io/a.pdf')).toBeNull();
    expect(messageFor(def(CrmPropertyType.File), 'http://cdn.io/a.pdf')).toBe(
      CUSTOM_FIELD_MESSAGES.file,
    );
  });

  it('accepts any text for types without a pattern', () => {
    expect(messageFor(def(CrmPropertyType.Date), '2026-10-15')).toBeNull();
    expect(messageFor(def(CrmPropertyType.Text), 'anything')).toBeNull();
  });

  it('builds one rule per property', () => {
    const schema = customFieldsSchema([
      def(CrmPropertyType.Text, { key: 'a', required: true }),
      def(CrmPropertyType.Number, { key: 'b' }),
    ]);
    const result = schema.safeParse({ a: '', b: 'x' });
    expect(result.error?.issues.map((issue) => [issue.path[0], issue.message])).toEqual([
      ['a', CUSTOM_FIELD_MESSAGES.required],
      ['b', CUSTOM_FIELD_MESSAGES.number],
    ]);
  });
});

describe('customDefaults', () => {
  const properties = [
    def(CrmPropertyType.Text, { key: 'text' }),
    def(CrmPropertyType.Date, { key: 'day' }),
    def(CrmPropertyType.MultiSelect, { key: 'multi', options: OPTIONS }),
    def(CrmPropertyType.Number, { key: 'count' }),
    def(CrmPropertyType.Boolean, { key: 'flag' }),
    def(CrmPropertyType.Text, { key: 'missing' }),
  ];

  it('turns stored values into the form strings and drops deleted properties', () => {
    const stored = {
      text: 'Hello',
      day: '2026-10-15T09:30:00.000Z',
      multi: ['A', 'B'],
      count: 12,
      flag: false,
      missing: null,
      deleted: 'gone',
    };
    expect(customDefaults(properties, stored)).toEqual({
      text: 'Hello',
      day: '2026-10-15',
      multi: 'A\nB',
      count: '12',
      flag: 'false',
      missing: '',
    });
  });

  it('starts every property blank on a row without custom values', () => {
    expect(customDefaults(properties.slice(0, 2), undefined)).toEqual({ text: '', day: '' });
  });

  it('writes an unexpected object as JSON rather than [object Object]', () => {
    expect(customDefaults([def(CrmPropertyType.Text, { key: 'x' })], { x: { a: 1 } })).toEqual({
      x: '{"a":1}',
    });
  });
});

describe('toCustomInput', () => {
  it('drops blanks and converts numbers, Yes/No and multi-selects', () => {
    const properties = [
      def(CrmPropertyType.Text, { key: 'text' }),
      def(CrmPropertyType.Number, { key: 'count' }),
      def(CrmPropertyType.Boolean, { key: 'yes' }),
      def(CrmPropertyType.Boolean, { key: 'no' }),
      def(CrmPropertyType.MultiSelect, { key: 'multi' }),
      def(CrmPropertyType.Text, { key: 'blank' }),
      def(CrmPropertyType.Text, { key: 'absent' }),
    ];
    const values = {
      text: ' Hi ',
      count: '7.5',
      yes: 'true',
      no: 'false',
      multi: 'A\n\nB',
      blank: '   ',
    };
    expect(toCustomInput(properties, values)).toEqual({
      text: 'Hi',
      count: 7.5,
      yes: true,
      no: false,
      multi: ['A', 'B'],
    });
  });

  it('is empty when the form has no custom values', () => {
    expect(toCustomInput([def(CrmPropertyType.Text)], undefined)).toEqual({});
  });
});
