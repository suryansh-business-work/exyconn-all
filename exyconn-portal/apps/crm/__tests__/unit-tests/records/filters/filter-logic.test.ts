import { describe, expect, it } from 'vitest';
import { CrmOp, CrmPropertyType } from '@exyconn/shell/graphql/generated';
import { conditionIssue, type ConditionDraft } from '../../../../src/records/filters/conditionIssue';
import {
  describeCondition,
  type DescribeTools,
} from '../../../../src/records/filters/describeCondition';
import { OP_LABELS, blankValues, opArity } from '../../../../src/records/filters/operators';
import {
  hasPresence,
  presenceProperties,
  withPresence,
} from '../../../../src/records/filters/presence';
import type { FilterCondition, FilterGroup } from '../../../../src/records/list/recordQuery';
import { choiceProperty, property } from '../records-fixtures';

const ALL_OPS = Object.values(CrmOp);
const TEXT = property({ ops: ALL_OPS });
const NUMBER = property({ key: 'value', label: 'Value', type: CrmPropertyType.Number, ops: ALL_OPS });
const DATE = property({ key: 'due', label: 'Due', type: CrmPropertyType.Date, ops: ALL_OPS });

describe('opArity', () => {
  it('knows how many values each operator takes', () => {
    expect(opArity(CrmOp.IsEmpty)).toBe('none');
    expect(opArity(CrmOp.IsNotEmpty)).toBe('none');
    expect(opArity(CrmOp.In)).toBe('many');
    expect(opArity(CrmOp.NotIn)).toBe('many');
    expect(opArity(CrmOp.Between)).toBe('two');
    expect(opArity(CrmOp.Contains)).toBe('one');
    expect(OP_LABELS[CrmOp.NotContains]).toBe("doesn't contain");
  });

  it('starts each operator with its own blank values', () => {
    expect(blankValues(CrmOp.IsEmpty)).toEqual([]);
    expect(blankValues(CrmOp.Eq)).toEqual(['']);
    expect(blankValues(CrmOp.Between)).toEqual(['', '']);
    expect(blankValues(CrmOp.In)).toEqual([]);
  });
});

const draft = (op: ConditionDraft['op'], values: string[] = []): ConditionDraft => ({
  property: 'x',
  op,
  values,
});

describe('conditionIssue', () => {
  it('asks for a property, then an operator the property offers', () => {
    expect(conditionIssue(draft(CrmOp.Eq), undefined)).toEqual({
      field: 'property',
      message: 'Choose a property',
    });
    expect(conditionIssue(draft(''), TEXT)?.field).toBe('op');
    expect(conditionIssue(draft(CrmOp.Gt), property({ ops: [CrmOp.Eq] }))).toEqual({
      field: 'op',
      message: 'Choose how to compare',
    });
  });

  it('needs no value for known/unknown and at least one option for a list', () => {
    expect(conditionIssue(draft(CrmOp.IsEmpty), TEXT)).toBeNull();
    expect(conditionIssue(draft(CrmOp.In), TEXT)).toEqual({
      field: 'values',
      message: 'Choose at least one option',
    });
    expect(conditionIssue(draft(CrmOp.NotIn, ['A']), TEXT)).toBeNull();
  });

  it('checks a range of numbers', () => {
    const message = (values: string[]) => conditionIssue(draft(CrmOp.Between, values), NUMBER)?.message;
    expect(message([])).toBe('Enter both values');
    expect(message(['1', ' '])).toBe('Enter both values');
    expect(message(['1', 'x'])).toBe('Enter a number in both boxes');
    expect(message(['x', '1'])).toBe('Enter a number in both boxes');
    expect(message(['5', '1'])).toBe('The first number must not be larger than the second');
    expect(message(['1', '5'])).toBeUndefined();
  });

  it('checks a range of dates', () => {
    const message = (values: string[]) => conditionIssue(draft(CrmOp.Between, values), DATE)?.message;
    expect(message(['2026-10-20', '2026-10-01'])).toBe('The start date must be on or before the end');
    expect(message(['2026-10-01', '2026-10-01'])).toBeUndefined();
  });

  it('checks a single value by operator and type', () => {
    const message = (op: CrmOp, values: string[], on = TEXT) =>
      conditionIssue(draft(op, values), on)?.message;
    expect(message(CrmOp.Eq, [])).toBe('Enter a value');
    expect(message(CrmOp.Eq, ['  '])).toBe('Enter a value');
    expect(message(CrmOp.LastDays, ['0'], DATE)).toBe('Enter a whole number of days, 1 or more');
    expect(message(CrmOp.LastDays, ['1.5'], DATE)).toBe('Enter a whole number of days, 1 or more');
    expect(message(CrmOp.LastDays, ['7'], DATE)).toBeUndefined();
    expect(message(CrmOp.Gt, ['ten'], NUMBER)).toBe('Enter a number');
    expect(message(CrmOp.Gt, ['10'], NUMBER)).toBeUndefined();
    expect(message(CrmOp.Contains, ['ten'])).toBeUndefined();
  });
});

const TOOLS: DescribeTools = {
  t: ((text: string, values?: Record<string, unknown>) =>
    text.replaceAll(/\{(\w+)\}/g, (_match, key: string) => String(values?.[key] ?? ''))) as never,
  formatters: {
    formatDate: (value) => `D:${String(value)}`,
    formatNumber: (value) => `N:${value}`,
    yes: 'Yes',
    no: 'No',
  },
  formatList: (items) => items.join(' or '),
};

const condition = (overrides: Partial<FilterCondition>): FilterCondition => ({
  id: 'c',
  property: 'name',
  op: CrmOp.Contains,
  values: [],
  ...overrides,
});

describe('describeCondition', () => {
  it('reads list conditions with option labels', () => {
    const stage = choiceProperty({ NEW: 'New', HOT: 'Hot' });
    expect(
      describeCondition(condition({ property: 'stage', op: CrmOp.In, values: ['NEW', 'HOT'] }), stage, TOOLS),
    ).toBe('Stage is any of New or Hot');
  });

  it('names a deleted property by its key, without values', () => {
    expect(describeCondition(condition({ property: 'gone', values: ['x'] }), undefined, TOOLS)).toBe(
      'gone contains',
    );
  });

  it('reads known/unknown without a value', () => {
    expect(describeCondition(condition({ op: CrmOp.IsEmpty }), TEXT, TOOLS)).toBe('Name is unknown');
  });

  it('reads Yes/No checks as themselves or with No', () => {
    const hasEmail = property({ key: 'hasEmail', label: 'Has email', type: CrmPropertyType.Boolean, filterOnly: true });
    expect(describeCondition(condition({ op: CrmOp.Eq, values: ['true'] }), hasEmail, TOOLS)).toBe('Has email');
    expect(describeCondition(condition({ op: CrmOp.Eq, values: ['false'] }), hasEmail, TOOLS)).toBe(
      'Has email: No',
    );
    expect(describeCondition(condition({ op: CrmOp.Neq, values: ['true'] }), hasEmail, TOOLS)).toBe(
      'Has email is not Yes',
    );
    expect(describeCondition(condition({ op: CrmOp.Eq, values: ['false'] }), property({ type: CrmPropertyType.Boolean }), TOOLS)).toBe(
      'Name is No',
    );
  });

  it('reads ranges, numbers, dates and last days', () => {
    expect(describeCondition(condition({ op: CrmOp.Between, values: ['1', '9'] }), NUMBER, TOOLS)).toBe(
      'Value is between N:1 and N:9',
    );
    expect(describeCondition(condition({ op: CrmOp.Between, values: [] }), NUMBER, TOOLS)).toBe(
      'Value is between  and ',
    );
    expect(describeCondition(condition({ op: CrmOp.Before, values: ['2026-10-15'] }), DATE, TOOLS)).toBe(
      'Due is before D:2026-10-15',
    );
    expect(describeCondition(condition({ op: CrmOp.LastDays, values: ['7'] }), DATE, TOOLS)).toBe(
      'Due is in the last 7 days',
    );
    expect(describeCondition(condition({ op: CrmOp.LastDays, values: [] }), DATE, TOOLS)).toBe(
      'Due is in the last  days',
    );
  });
});

const present = (key: string): FilterCondition => ({ id: `p-${key}`, property: key, op: CrmOp.Eq, values: ['true'] });
const other: FilterCondition = { id: 'o', property: 'name', op: CrmOp.Contains, values: ['a'] };

describe('presence', () => {
  it('offers only the filter-only Yes/No checks', () => {
    const hasEmail = property({ key: 'hasEmail', type: CrmPropertyType.Boolean, filterOnly: true });
    const flag = property({ key: 'vip', type: CrmPropertyType.Boolean });
    const filterText = property({ key: 'q', filterOnly: true });
    expect(presenceProperties([hasEmail, flag, filterText])).toEqual([hasEmail]);
  });

  it('is on only when every group requires the check', () => {
    expect(hasPresence([], 'hasEmail')).toBe(false);
    expect(hasPresence([{ id: 'g', conditions: [present('hasEmail')] }], 'hasEmail')).toBe(true);
    const mixed: FilterGroup[] = [
      { id: 'g1', conditions: [present('hasEmail')] },
      { id: 'g2', conditions: [other] },
    ];
    expect(hasPresence(mixed, 'hasEmail')).toBe(false);
    const no: FilterGroup[] = [
      { id: 'g', conditions: [{ ...present('hasEmail'), values: ['false'] }] },
    ];
    expect(hasPresence(no, 'hasEmail')).toBe(false);
    const neq: FilterGroup[] = [{ id: 'g', conditions: [{ ...present('hasEmail'), op: CrmOp.Neq }] }];
    expect(hasPresence(neq, 'hasEmail')).toBe(false);
  });

  it('starts a group when turned on with none', () => {
    const groups = withPresence([], 'hasEmail', true);
    expect(groups).toHaveLength(1);
    expect(groups[0].conditions).toEqual([
      { id: expect.any(String), property: 'hasEmail', op: CrmOp.Eq, values: ['true'] },
    ]);
  });

  it('adds the check to every group, replacing other conditions on the key', () => {
    const groups: FilterGroup[] = [
      { id: 'g1', conditions: [other, { ...present('hasEmail'), values: ['false'] }] },
      { id: 'g2', conditions: [] },
    ];
    const next = withPresence(groups, 'hasEmail', true);
    expect(next.map((group) => group.conditions.map((c) => [c.property, c.values[0]]))).toEqual([
      [
        ['name', 'a'],
        ['hasEmail', 'true'],
      ],
      [['hasEmail', 'true']],
    ]);
  });

  it('takes the check out of every group, dropping emptied groups', () => {
    const groups: FilterGroup[] = [
      { id: 'g1', conditions: [other, present('hasEmail')] },
      { id: 'g2', conditions: [present('hasEmail')] },
    ];
    expect(withPresence(groups, 'hasEmail', false)).toEqual([{ id: 'g1', conditions: [other] }]);
  });
});
