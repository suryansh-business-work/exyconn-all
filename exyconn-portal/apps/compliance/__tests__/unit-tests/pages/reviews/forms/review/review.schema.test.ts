import { afterEach, describe, expect, it, vi } from 'vitest';
import { ManagementReviewStatus } from '@exyconn/shell/graphql/generated';
import {
  reviewSchema,
  toReviewInput,
  toReviewValues,
} from '../../../../../../src/pages/reviews/forms/review';
import { reviewRow } from '../../../compliance.fixtures';

const saved = () => toReviewValues(reviewRow());
const messages = (values: unknown) =>
  reviewSchema.safeParse(values).error?.issues.map((issue) => issue.message) ?? [];

describe('toReviewValues', () => {
  afterEach(() => vi.useRealTimers());

  it('plans a new review for today with no actions yet', () => {
    const now = new Date('2026-10-07T09:00:00.000Z');
    vi.useFakeTimers({ now });
    expect(toReviewValues(null)).toEqual({
      title: '',
      standards: [],
      heldOn: now,
      chairName: '',
      attendees: '',
      inputs: '',
      decisions: '',
      actions: [],
      status: ManagementReviewStatus.Planned,
    });
  });

  it('loads a held review with each action and its due date', () => {
    expect(saved().heldOn).toEqual(new Date('2026-09-30T00:00:00.000Z'));
    expect(saved().actions).toEqual([
      {
        description: 'Hire a second auditor',
        ownerName: 'Priya',
        dueOn: new Date('2026-12-31T00:00:00.000Z'),
        done: false,
      },
      { description: 'Refresh the policy', ownerName: '', dueOn: null, done: true },
    ]);
  });
});

describe('reviewSchema', () => {
  it('accepts a saved review as it loads', () => {
    expect(reviewSchema.safeParse(saved()).success).toBe(true);
  });

  it('asks for a name and at least one standard', () => {
    expect(messages(toReviewValues(null))).toEqual([
      'Name the review',
      'Pick at least one standard',
    ]);
  });

  it('asks what each action is', () => {
    const values = {
      ...saved(),
      actions: [{ description: ' ', ownerName: '', dueOn: '', done: false }],
    };
    expect(reviewSchema.safeParse(values).error?.issues[0]).toMatchObject({
      message: 'Say what the action is',
      path: ['actions', 0, 'description'],
    });
  });

  it('will not minute a review that says nothing about what was considered or decided', () => {
    const minuted = { ...saved(), status: ManagementReviewStatus.Minuted };
    expect(reviewSchema.safeParse(minuted).success).toBe(true);
    const expected = ['A minuted review has to say what was considered and what was decided'];
    expect(messages({ ...minuted, inputs: '' })).toEqual(expected);
    expect(messages({ ...minuted, decisions: '' })).toEqual(expected);
  });

  it('lets a planned or held review wait for its minute', () => {
    expect(messages({ ...saved(), inputs: '', decisions: '' })).toEqual([]);
  });
});

describe('toReviewInput', () => {
  it('sends the meeting date and each due date back as ISO strings', () => {
    const input = toReviewInput(reviewSchema.parse(saved()));
    expect(input.heldOn).toBe('2026-09-30T00:00:00.000Z');
    expect(input.actions.map((action) => action.dueOn)).toEqual(['2026-12-31T00:00:00.000Z', null]);
    expect(input.actions[1]).toMatchObject({ description: 'Refresh the policy', done: true });
  });
});
