import { describe, expect, it } from 'vitest';
import { AudienceRuleOperator } from '@exyconn/shell/graphql/generated';
import { AUDIENCE_COLUMNS } from '../../../../src/pages/audiences/audiences-grid';
import { actionSpecs, columnIds, formatCell } from '../../grid-helpers';
import { audienceRow } from '../../fixtures';

const condition = (field: string) => ({
  __typename: 'AudienceCondition' as const,
  field,
  operator: AudienceRuleOperator.IsNotEmpty,
  value: '',
});

describe('AUDIENCE_COLUMNS', () => {
  it('lists the audience register columns, with the actions last and no recipient count', () => {
    expect(columnIds(AUDIENCE_COLUMNS)).toEqual([
      'name',
      'description',
      'recipientSource',
      'emailSelection',
      'updateMode',
      'rules',
      'actions',
    ]);
  });

  it('counts the filter conditions on each audience', () => {
    expect(formatCell(AUDIENCE_COLUMNS, 'rules', audienceRow())).toBe('0');
    expect(
      formatCell(
        AUDIENCE_COLUMNS,
        'rules',
        audienceRow({ conditions: [condition('company.industry'), condition('contact.title')] }),
      ),
    ).toBe('2');
  });

  it('writes nothing in the conditions cell while the row is still loading', () => {
    expect(formatCell(AUDIENCE_COLUMNS, 'rules', undefined)).toBe('');
  });

  it('offers members before the default edit and delete actions', () => {
    const specs = actionSpecs(AUDIENCE_COLUMNS);

    expect(specs.map((spec) => spec.key)).toEqual(['members', 'edit', 'delete']);
    expect(specs[0]).toMatchObject({ label: 'view members', color: 'primary' });
  });
});
