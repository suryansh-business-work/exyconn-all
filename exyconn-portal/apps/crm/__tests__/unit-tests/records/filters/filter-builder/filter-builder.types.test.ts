import { describe, expect, it } from 'vitest';
import { CrmOp, CrmPropertyType } from '@exyconn/shell/graphql/generated';
import {
  filterBuilderSchema,
  fromBuilderValues,
  toBuilderValues,
} from '../../../../../src/records/filters/filter-builder';
import { property } from '../../records-fixtures';

const NAME = property({ ops: [CrmOp.Contains, CrmOp.IsEmpty] });
const VALUE = property({ key: 'value', type: CrmPropertyType.Number, ops: [CrmOp.Gt] });

describe('filterBuilderSchema', () => {
  const schema = filterBuilderSchema([NAME, VALUE]);

  it('passes complete conditions and blank rows', () => {
    const result = schema.safeParse({
      groups: [
        {
          conditions: [
            { property: 'name', op: CrmOp.Contains, values: ['acme'] },
            { property: '', op: '', values: [] },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('reports each problem on the field it belongs to', () => {
    const result = schema.safeParse({
      groups: [
        { conditions: [{ property: 'gone', op: CrmOp.Eq, values: [] }] },
        {
          conditions: [
            { property: 'name', op: CrmOp.Gt, values: [] },
            { property: 'value', op: CrmOp.Gt, values: ['ten'] },
          ],
        },
      ],
    });
    expect(result.error?.issues.map((issue) => [issue.path.join('.'), issue.message])).toEqual([
      ['groups.0.conditions.0.property', 'Choose a property'],
      ['groups.1.conditions.0.op', 'Choose how to compare'],
      ['groups.1.conditions.1.values', 'Enter a number'],
    ]);
  });
});

describe('toBuilderValues / fromBuilderValues', () => {
  it('opens on one blank row when there are no filters', () => {
    expect(toBuilderValues([])).toEqual({
      groups: [{ conditions: [{ property: '', op: '', values: [] }] }],
    });
  });

  it('copies the list filters without their ids', () => {
    const values = ['acme'];
    const draft = toBuilderValues([
      { id: 'g', conditions: [{ id: 'c', property: 'name', op: CrmOp.Contains, values }] },
    ]);
    expect(draft).toEqual({
      groups: [{ conditions: [{ property: 'name', op: CrmOp.Contains, values: ['acme'] }] }],
    });
    expect(draft.groups[0].conditions[0].values).not.toBe(values);
  });

  it('applies filled-in conditions with fresh ids and drops empty groups', () => {
    const groups = fromBuilderValues({
      groups: [
        {
          conditions: [
            { property: 'name', op: CrmOp.Contains, values: ['acme'] },
            { property: '', op: '', values: [] },
          ],
        },
        { conditions: [{ property: '', op: '', values: [] }] },
      ],
    });
    expect(groups).toEqual([
      {
        id: expect.any(String),
        conditions: [
          { id: expect.any(String), property: 'name', op: CrmOp.Contains, values: ['acme'] },
        ],
      },
    ]);
  });
});
