import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ComplianceCategory,
  ObjectiveFrequency,
  ObjectiveScope,
  ObjectiveStatus,
} from '@exyconn/shell/graphql/generated';
import {
  objectiveSchema,
  toObjectiveInput,
  toObjectiveValues,
} from '../../../../../../src/pages/objectives/forms/objective';
import { objectiveRow } from '../../../compliance.fixtures';

const saved = () => toObjectiveValues(objectiveRow());
const messages = (values: unknown) =>
  objectiveSchema.safeParse(values).error?.issues.map((issue) => issue.message) ?? [];

describe('toObjectiveValues', () => {
  afterEach(() => vi.useRealTimers());

  it('starts a new objective as a quarterly company quality objective for today', () => {
    const now = new Date('2026-10-07T09:00:00.000Z');
    vi.useFakeTimers({ now });
    expect(toObjectiveValues(null)).toEqual({
      title: '',
      description: '',
      standards: [],
      category: ComplianceCategory.Quality,
      scope: ObjectiveScope.Company,
      area: '',
      ownerId: '',
      ownerName: '',
      measure: '',
      unit: '',
      baseline: 0,
      target: 0,
      actual: 0,
      frequency: ObjectiveFrequency.Quarterly,
      periodStart: now,
      periodEnd: now,
      status: ObjectiveStatus.Planned,
      plan: '',
    });
  });

  it('loads a saved objective with its period as dates', () => {
    expect(saved()).toMatchObject({ title: 'Fewer complaints', baseline: 20, target: 10 });
    expect(saved().periodStart).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(saved().periodEnd).toEqual(new Date('2026-12-31T00:00:00.000Z'));
  });
});

describe('objectiveSchema', () => {
  it('accepts a saved objective as it loads', () => {
    expect(objectiveSchema.safeParse(saved()).success).toBe(true);
  });

  it('asks for the objective, its standard, owner and measure, and a target to reach', () => {
    expect(messages(toObjectiveValues(null))).toEqual([
      'Say what the objective is',
      'Pick at least one standard',
      'An objective needs an owner',
      'Say how it is measured',
      'The target has to differ from the baseline, or there is nothing to achieve',
    ]);
    const filled = { ...saved(), target: 20 };
    expect(messages(filled)).toEqual([
      'The target has to differ from the baseline, or there is nothing to achieve',
    ]);
  });

  it('reads the typed figures as numbers and refuses text', () => {
    const parsed = objectiveSchema.parse({ ...saved(), baseline: '8', target: '2', actual: '5' });
    expect(parsed).toMatchObject({ baseline: 8, target: 2, actual: 5 });
    expect(messages({ ...saved(), actual: 'lots' })).toEqual(['Current value must be a number']);
  });

  it('refuses a period that ends before it starts, and a cleared start', () => {
    const backwards = { ...saved(), periodEnd: '2025-12-31T00:00:00.000Z' };
    expect(objectiveSchema.safeParse(backwards).error?.issues[0]).toMatchObject({
      message: 'The period cannot end before it starts',
      path: ['periodEnd'],
    });
    expect(messages({ ...saved(), periodStart: '' })).toEqual(['Say when the period starts']);
  });
});

describe('toObjectiveInput', () => {
  it('sends the period back as ISO strings', () => {
    const input = toObjectiveInput(objectiveSchema.parse(saved()));
    expect(input).toMatchObject({
      title: 'Fewer complaints',
      periodStart: '2026-01-01T00:00:00.000Z',
      periodEnd: '2026-12-31T00:00:00.000Z',
    });
  });
});
