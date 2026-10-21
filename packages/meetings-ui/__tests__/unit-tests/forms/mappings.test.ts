import { describe, expect, it } from 'vitest';
import { MaActionStatus, MaPriority, MaReleaseStatus } from '@exyconn/shell/graphql/generated';
import { toActionInput, toActionValues } from '../../../src/forms/action-item';
import { toBulkInput } from '../../../src/forms/action-bulk';
import { toSpeakerInput } from '../../../src/forms/confirm-speaker';
import { toFormValues, toNotesContent } from '../../../src/forms/notes';
import { toReleaseStatusInput } from '../../../src/forms/release-status';
import { makeAction, makeContent } from '../fixtures';

describe('action item mapping', () => {
  it('starts a new item pending at medium priority with nothing filled in', () => {
    expect(toActionValues(null)).toEqual({
      title: '',
      description: '',
      assignedTo: '',
      assignedUserId: '',
      dueDate: '',
      priority: MaPriority.Medium,
      status: MaActionStatus.Pending,
    });
  });

  it('round-trips an item, sending empty optional fields as null', () => {
    const values = toActionValues(
      makeAction({ assignedTo: null, assignedUserId: null, dueDate: null }),
    );
    expect(toActionInput(values)).toEqual({
      title: 'Send the proposal',
      description: 'Include the revised pricing',
      assignedTo: null,
      assignedUserId: null,
      dueDate: null,
      priority: MaPriority.High,
      status: MaActionStatus.Pending,
    });
    expect(toActionInput(toActionValues(makeAction())).dueDate).toBe('2026-10-25T00:00:00.000Z');
  });
});

describe('toBulkInput', () => {
  it('sends only the fields being set', () => {
    expect(toBulkInput(['a', 'b'], { status: MaActionStatus.Completed, priority: '' })).toEqual({
      ids: ['a', 'b'],
      status: MaActionStatus.Completed,
      priority: undefined,
    });
    expect(toBulkInput(['a'], { status: '', priority: MaPriority.Low })).toEqual({
      ids: ['a'],
      status: undefined,
      priority: MaPriority.Low,
    });
  });
});

describe('toSpeakerInput', () => {
  it('names the label, with no portal user as null', () => {
    expect(toSpeakerInput('Speaker 1', { name: 'Ravi', userId: '' })).toEqual({
      label: 'Speaker 1',
      name: 'Ravi',
      userId: null,
    });
    expect(toSpeakerInput('Speaker 1', { name: 'Ravi', userId: 'u2' }).userId).toBe('u2');
  });
});

describe('notes mapping', () => {
  it('edits each list as one item per line and saves trimmed, non-blank lines', () => {
    const values = toFormValues(makeContent());
    expect(values.discussionPoints).toBe('Pricing\nTimeline');
    expect(
      toNotesContent({ ...values, overview: '  New overview ', risks: ' Budget \n\n  Hiring ' }),
    ).toEqual(makeContent({ overview: 'New overview', risks: ['Budget', 'Hiring'] }));
  });
});

describe('toReleaseStatusInput', () => {
  it('leaves out store fields that were not given', () => {
    expect(
      toReleaseStatusInput({
        status: MaReleaseStatus.InReview,
        note: 'Sent',
        storeItemId: '',
        storeUrl: '',
      }),
    ).toEqual({
      status: MaReleaseStatus.InReview,
      note: 'Sent',
      storeItemId: null,
      storeUrl: null,
    });
    expect(
      toReleaseStatusInput({
        status: MaReleaseStatus.Published,
        note: 'Live',
        storeItemId: 'item',
        storeUrl: 'https://chromewebstore.google.com/detail/item',
      }).storeUrl,
    ).toBe('https://chromewebstore.google.com/detail/item');
  });
});
