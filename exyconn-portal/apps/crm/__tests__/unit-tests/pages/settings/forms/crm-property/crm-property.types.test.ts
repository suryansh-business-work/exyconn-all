import { describe, expect, it } from 'vitest';
import { CrmObject, CrmPropertyType } from '@exyconn/shell/graphql/generated';
import {
  crmPropertySchema,
  toPropertyFormValues,
  toPropertyInput,
  toPropertyUpdateInput,
  type CrmPropertyFormValues,
} from '../../../../../../src/pages/settings/forms/crm-property';
import { propertyRow } from '../../settings-fixtures';

const TAKEN = {
  [CrmObject.Lead]: new Set(['email']),
  [CrmObject.Company]: new Set(['domain']),
  [CrmObject.Contact]: new Set<string>(),
};

const valid = (overrides: Partial<CrmPropertyFormValues> = {}): CrmPropertyFormValues => ({
  label: 'Lead score',
  key: 'lead_score',
  objects: [CrmObject.Lead],
  type: CrmPropertyType.Number,
  options: [],
  required: false,
  description: '',
  ...overrides,
});

const choice = (label: string, value: string) => ({ label, value, saved: false });

/** The first message a parse reports for each field, keyed by the dotted path of the field they belong to. */
function issuesOf(values: unknown, taken: typeof TAKEN | null = TAKEN): Record<string, string> {
  const result = crmPropertySchema(taken).safeParse(values);
  if (result.success) {
    return {};
  }
  const first: Record<string, string> = {};
  for (const issue of result.error.issues) {
    first[issue.path.join('.')] ??= issue.message;
  }
  return first;
}

describe('crmPropertySchema', () => {
  it('accepts a complete property and trims its text', () => {
    const result = crmPropertySchema(TAKEN).safeParse(
      valid({ label: '  Lead score ', description: ' Out of 100 ' }),
    );

    expect(result.success).toBe(true);
    expect(result.data?.label).toBe('Lead score');
    expect(result.data?.description).toBe('Out of 100');
  });

  it('requires a label, a well-formed key and at least one record type', () => {
    expect(issuesOf(valid({ label: ' ', key: '', objects: [] }))).toEqual({
      label: 'Give the property a label',
      key: 'Enter a key',
      objects: 'Choose at least one record type',
    });
    expect(issuesOf(valid({ key: '9lives' }))).toEqual({
      key: 'Start with a lowercase letter, then use lowercase letters, digits and _ (up to 40)',
    });
  });

  it('caps the label at 80 and the help text at 300 characters', () => {
    expect(issuesOf(valid({ label: 'x'.repeat(80), description: 'y'.repeat(300) }))).toEqual({});
    expect(issuesOf(valid({ label: 'x'.repeat(81), description: 'y'.repeat(301) }))).toEqual({
      label: 'A label is at most 80 characters',
      description: 'Help text is at most 300 characters',
    });
  });

  it('wants 1 to 100 choices on a choice type, and ignores them on any other', () => {
    expect(issuesOf(valid({ type: CrmPropertyType.Enum }))).toEqual({
      options: 'Add 1 to 100 choices',
    });
    const many = Array.from({ length: 101 }, (_, index) => choice(`C${index}`, `c${index}`));
    expect(issuesOf(valid({ type: CrmPropertyType.MultiSelect, options: many }))).toEqual({
      options: 'Add 1 to 100 choices',
    });
    expect(issuesOf(valid({ type: CrmPropertyType.Radio, options: many.slice(0, 100) }))).toEqual(
      {},
    );
    expect(issuesOf(valid({ options: [choice('', '')] }))).toEqual({});
  });

  it('wants every choice named and valued, with no value used twice', () => {
    const options = [choice('', 'a'), choice('B', ''), choice('C', 'a')];

    expect(issuesOf(valid({ type: CrmPropertyType.Enum, options }))).toEqual({
      'options.0.label': 'Name the choice',
      'options.1.value': 'Give it a value',
      'options.2.value': 'Two choices cannot share a value',
    });
  });

  it('caps a choice and its value at 80 characters', () => {
    const options = [choice('x'.repeat(81), 'y'.repeat(81))];

    expect(issuesOf(valid({ type: CrmPropertyType.Enum, options }))).toEqual({
      'options.0.label': 'A choice is at most 80 characters',
      'options.0.value': 'A value is at most 80 characters',
    });
  });

  it('names the first chosen record type that already uses the key', () => {
    expect(
      issuesOf(valid({ key: 'domain', objects: [CrmObject.Contact, CrmObject.Company] })),
    ).toEqual({ key: 'Companies already have a property with this key' });
    expect(issuesOf(valid({ key: 'email', objects: [CrmObject.Lead] }))).toEqual({
      key: 'Leads already have a property with this key',
    });
    expect(issuesOf(valid({ key: 'email', objects: [CrmObject.Contact] }))).toEqual({});
  });

  it('skips the clash check when editing, because the key is fixed by then', () => {
    expect(issuesOf(valid({ key: 'email' }), null)).toEqual({});
  });
});

describe('toPropertyFormValues', () => {
  it('starts a new property on the tab it was opened from', () => {
    expect(toPropertyFormValues(null, CrmObject.Contact)).toEqual({
      label: '',
      key: '',
      objects: [CrmObject.Contact],
      type: CrmPropertyType.Text,
      options: [],
      required: false,
      description: '',
    });
  });

  it('loads a saved property on its own record type with its choices marked saved', () => {
    const row = propertyRow({
      object: CrmObject.Company,
      type: CrmPropertyType.Enum,
      required: true,
      description: 'Tier',
      options: [{ value: 'gold', label: 'Gold' }],
    });

    expect(toPropertyFormValues(row, CrmObject.Lead)).toEqual({
      label: 'Lead score',
      key: 'lead_score',
      objects: [CrmObject.Company],
      type: CrmPropertyType.Enum,
      options: [{ value: 'gold', label: 'Gold', saved: true }],
      required: true,
      description: 'Tier',
    });
  });
});

describe('save inputs', () => {
  const options = [{ label: 'Gold', value: 'gold', saved: true }];

  it('sends the choices without bookkeeping for a choice type', () => {
    expect(toPropertyUpdateInput(valid({ type: CrmPropertyType.Radio, options }))).toEqual({
      label: 'Lead score',
      options: [{ value: 'gold', label: 'Gold' }],
      required: false,
      description: '',
    });
  });

  it('drops leftover choices for any other type', () => {
    expect(toPropertyUpdateInput(valid({ options })).options).toEqual([]);
  });

  it('adds the key, type and record types when creating', () => {
    expect(toPropertyInput(valid({ objects: [CrmObject.Lead, CrmObject.Contact] }))).toEqual({
      label: 'Lead score',
      options: [],
      required: false,
      description: '',
      objects: [CrmObject.Lead, CrmObject.Contact],
      key: 'lead_score',
      type: CrmPropertyType.Number,
    });
  });
});
