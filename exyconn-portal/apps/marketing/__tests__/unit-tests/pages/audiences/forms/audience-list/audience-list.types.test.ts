import { describe, expect, it } from 'vitest';
import {
  AudienceEmailSelection,
  AudienceRecipientSource,
  AudienceRuleCombinator,
  AudienceRuleOperator,
  AudienceUpdateMode,
} from '@exyconn/shell/graphql/generated';
import {
  MAX_CONDITIONS,
  audienceSchema,
  conditionProblem,
  newConditionKey,
  toFormValues,
  toInput,
  toPreviewInput,
  type AudienceConditionValues,
  type AudienceFormValues,
} from '../../../../../../src/pages/audiences/forms/audience-list/audience-list.types';
import { audienceRow } from '../../../../fixtures';

const valid = (overrides: Partial<AudienceFormValues> = {}): AudienceFormValues => ({
  ...toFormValues(null),
  name: 'Delhi cafés',
  ...overrides,
});

const condition = (overrides: Partial<AudienceConditionValues> = {}): AudienceConditionValues => ({
  key: 'k1',
  field: 'contact.city',
  operator: AudienceRuleOperator.Equals,
  value: 'Delhi',
  ...overrides,
});

/** Every message the schema reports for the values, keyed by the field path. */
function problems(values: AudienceFormValues): Record<string, string> {
  const result = audienceSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
  );
}

describe('conditionProblem', () => {
  it('asks for a field before anything else', () => {
    expect(conditionProblem(condition({ field: '', value: '' }))).toBe('Choose a field');
    expect(conditionProblem(condition({ field: '', operator: AudienceRuleOperator.IsEmpty }))).toBe(
      'Choose a field',
    );
  });

  it('needs no value for an operator that compares against nothing', () => {
    for (const operator of [
      AudienceRuleOperator.IsEmpty,
      AudienceRuleOperator.IsNotEmpty,
      AudienceRuleOperator.Never,
    ]) {
      expect(conditionProblem(condition({ operator, value: '' }))).toBeNull();
    }
  });

  it('needs a value for a comparison', () => {
    expect(conditionProblem(condition({ value: '' }))).toBe('Enter a value');
    expect(
      conditionProblem(condition({ operator: AudienceRuleOperator.Contains, value: 'Del' })),
    ).toBeNull();
  });

  it('takes whole days from 1 to 3650 for a day comparison', () => {
    const days = (value: string) =>
      conditionProblem(condition({ operator: AudienceRuleOperator.WithinDays, value }));
    const message = 'Enter a number of days from 1 to 3650';

    expect(days('1')).toBeNull();
    expect(days('3650')).toBeNull();
    expect(days('0')).toBe(message);
    expect(days('3651')).toBe(message);
    expect(days('1.5')).toBe(message);
    expect(days('-3')).toBe(message);
    expect(days('ten')).toBe(message);
    expect(
      conditionProblem(condition({ operator: AudienceRuleOperator.OlderThanDays, value: '' })),
    ).toBe(message);
  });
});

describe('audienceSchema', () => {
  it('accepts the recommended defaults once the audience has a name', () => {
    expect(problems(valid())).toEqual({});
  });

  it('requires a name and trims it', () => {
    expect(problems(valid({ name: '   ' }))).toEqual({ name: 'Name is required' });
    expect(audienceSchema.parse(valid({ name: '  Cafés  ' })).name).toBe('Cafés');
  });

  it('caps the name at 120 characters and the description at 500', () => {
    expect(problems(valid({ name: 'a'.repeat(120), description: 'd'.repeat(500) }))).toEqual({});
    expect(problems(valid({ name: 'a'.repeat(121), description: 'd'.repeat(501) }))).toEqual({
      name: 'Keep the name under 120 characters',
      description: 'Keep the description under 500 characters',
    });
  });

  it('needs an email type when only selected types are used', () => {
    const selected = { emailSelection: AudienceEmailSelection.SelectedTypes };

    expect(problems(valid(selected))).toEqual({ emailTypes: 'Choose at least one email type' });
    expect(problems(valid({ ...selected, emailTypes: ['Sales'] }))).toEqual({});
    // Types left over from an earlier choice do not matter once another one is made.
    expect(problems(valid({ emailSelection: AudienceEmailSelection.All, emailTypes: [] }))).toEqual(
      {},
    );
  });

  it('needs at least one picked record when only picked records are used', () => {
    const picked = { recipientSource: AudienceRecipientSource.SelectedOnly };

    expect(problems(valid(picked))).toEqual({
      contactIds: 'Pick some records, or choose Contacts, Companies or Both',
    });
    expect(problems(valid({ ...picked, contactIds: ['p1'] }))).toEqual({});
    expect(problems(valid({ ...picked, companyIds: ['co1'] }))).toEqual({});
    expect(problems(valid({ ...picked, clientIds: ['c1'] }))).toEqual({});
    expect(problems(valid({ ...picked, allActiveClients: true }))).toEqual({});
  });

  it('checks every excluded address, reporting on the list the chips field shows', () => {
    expect(problems(valid({ excludedEmails: [' ceo@acme.io ', 'not-an-email'] }))).toEqual({
      excludedEmails: 'Every excluded address must be a valid email',
    });
    expect(
      audienceSchema.parse(valid({ excludedEmails: [' ceo@acme.io '] })).excludedEmails,
    ).toEqual(['ceo@acme.io']);
  });

  it('reports an incomplete condition on the input that is missing', () => {
    expect(
      problems(
        valid({ conditions: [condition({ field: '' }), condition({ key: 'k2', value: '' })] }),
      ),
    ).toEqual({ 'conditions.0.field': 'Choose a field', 'conditions.1.value': 'Enter a value' });
  });

  it('caps a condition value at 200 characters, after trimming', () => {
    expect(problems(valid({ conditions: [condition({ value: ` ${'v'.repeat(200)} ` })] }))).toEqual(
      {},
    );
    expect(problems(valid({ conditions: [condition({ value: 'v'.repeat(201) })] }))).toEqual({
      'conditions.0.value': 'Keep the value under 200 characters',
    });
  });

  it('takes at most 25 conditions', () => {
    const many = (count: number) =>
      Array.from({ length: count }, (_, index) => condition({ key: `k${index}` }));

    expect(problems(valid({ conditions: many(MAX_CONDITIONS) }))).toEqual({});
    expect(problems(valid({ conditions: many(MAX_CONDITIONS + 1) }))).toEqual({
      conditions: 'Use at most 25 conditions',
    });
  });
});

describe('toFormValues', () => {
  it('starts a new audience from everyone in the CRM, one address each, kept live', () => {
    expect(toFormValues(null)).toEqual({
      name: '',
      description: '',
      recipientSource: AudienceRecipientSource.Both,
      companyEmailSource: 'BOTH',
      emailSelection: AudienceEmailSelection.Primary,
      emailTypes: [],
      updateMode: AudienceUpdateMode.Dynamic,
      ruleCombinator: AudienceRuleCombinator.And,
      conditions: [],
      clientIds: [],
      contactIds: [],
      companyIds: [],
      allActiveClients: false,
      excludedEmails: [],
    });
  });

  it('loads a saved audience, giving each condition its own row key', () => {
    const row = audienceRow({
      recipientSource: AudienceRecipientSource.Contacts,
      updateMode: AudienceUpdateMode.FixedSnapshot,
      ruleCombinator: AudienceRuleCombinator.Or,
      excludedEmails: ['ceo@acme.io'],
      conditions: [
        { field: 'contact.city', operator: AudienceRuleOperator.Equals, value: 'Delhi' },
        { field: 'contact.city', operator: AudienceRuleOperator.Equals, value: 'Pune' },
      ],
    });

    const values = toFormValues(row);

    expect(values).toMatchObject({
      name: 'Newsletter',
      description: 'Monthly readers',
      recipientSource: AudienceRecipientSource.Contacts,
      updateMode: AudienceUpdateMode.FixedSnapshot,
      ruleCombinator: AudienceRuleCombinator.Or,
      clientIds: ['client-1'],
      contactIds: ['contact-1', 'contact-2'],
      excludedEmails: ['ceo@acme.io'],
    });
    expect(values.conditions.map((entry) => entry.value)).toEqual(['Delhi', 'Pune']);
    expect(values.conditions[0].key).not.toBe(values.conditions[1].key);
  });
});

describe('newConditionKey', () => {
  it('never repeats a key', () => {
    expect(new Set(Array.from({ length: 20 }, newConditionKey)).size).toBe(20);
  });
});

describe('toInput', () => {
  it('sends the values without the row keys', () => {
    const input = toInput(valid({ conditions: [condition()] }));

    expect(input.conditions).toEqual([
      { field: 'contact.city', operator: AudienceRuleOperator.Equals, value: 'Delhi' },
    ]);
    expect(input.name).toBe('Delhi cafés');
    expect(input).not.toHaveProperty('conditions.0.key');
  });
});

describe('toPreviewInput', () => {
  it('counts only the conditions and exclusions that are already complete', () => {
    const input = toPreviewInput(
      valid({
        conditions: [
          condition(),
          condition({ key: 'k2', field: '' }),
          condition({ key: 'k3', value: '' }),
          condition({ key: 'k4', operator: AudienceRuleOperator.Never, value: '' }),
        ],
        excludedEmails: ['ceo@acme.io', 'half@', ' cfo@acme.io '],
      }),
    );

    expect(input.conditions).toEqual([
      { field: 'contact.city', operator: AudienceRuleOperator.Equals, value: 'Delhi' },
      { field: 'contact.city', operator: AudienceRuleOperator.Never, value: '' },
    ]);
    expect(input.excludedEmails).toEqual(['ceo@acme.io', ' cfo@acme.io ']);
  });

  it('leaves complete settings as they are', () => {
    const values = valid({ conditions: [condition()], excludedEmails: ['ceo@acme.io'] });

    expect(toPreviewInput(values)).toEqual(toInput(values));
  });
});
