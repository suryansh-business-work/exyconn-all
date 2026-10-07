import { describe, expect, it } from 'vitest';
import { CONTACT_COLUMNS } from '../../../../src/pages/contacts/contacts-grid';
import { ACTIVITY_COLUMNS } from '../../../../src/pages/activities/activities-grid';
import { actionSpecs, columnIds } from '../../grid-helpers';

describe('CONTACT_COLUMNS', () => {
  it('lists the contact register columns, with the actions last', () => {
    expect(columnIds(CONTACT_COLUMNS)).toEqual([
      'name',
      'title',
      'companyName',
      'email',
      'phone',
      'status',
      'owner',
      'actions',
    ]);
  });

  it('offers the default edit and delete actions', () => {
    expect(actionSpecs(CONTACT_COLUMNS).map((spec) => spec.key)).toEqual(['edit', 'delete']);
  });
});

describe('ACTIVITY_COLUMNS', () => {
  it('lists the activity register columns, with the actions last', () => {
    expect(columnIds(ACTIVITY_COLUMNS)).toEqual([
      'subject',
      'type',
      'relatedType',
      'relatedName',
      'dueDate',
      'done',
      'owner',
      'actions',
    ]);
  });

  it('offers the default edit and delete actions', () => {
    expect(actionSpecs(ACTIVITY_COLUMNS).map((spec) => spec.key)).toEqual(['edit', 'delete']);
  });
});
