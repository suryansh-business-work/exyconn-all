import { z } from 'zod';
import { CrmOp } from '@exyconn/shell/graphql/generated';
import type { CrmPropertyInfo } from '../../schema';
import { newId, type FilterGroup } from '../../list/recordQuery';
import { conditionIssue, type ConditionDraft } from '../conditionIssue';

export type { ConditionDraft } from '../conditionIssue';

/**
 * An OR group as the builder holds it. Drafts carry no ids of their own: the builder's field
 * arrays key their rows, and applied conditions get fresh ids.
 */
export interface GroupDraft {
  conditions: ConditionDraft[];
}

export interface FilterBuilderValues {
  groups: GroupDraft[];
}

/** Where one condition sits in the builder's values. */
export type ConditionPath = `groups.${number}.conditions.${number}`;

const conditionShape = z.object({
  property: z.string(),
  op: z.union([z.enum(CrmOp), z.literal('')]),
  values: z.array(z.string()),
});

/**
 * The builder's schema. Each condition is checked against its property — its operators, how
 * many values that operator takes, and whether those are numbers, dates or day counts — and a
 * problem is reported on the field it belongs to.
 */
export function filterBuilderSchema(properties: readonly CrmPropertyInfo[]) {
  const byKey = new Map(properties.map((property) => [property.key, property]));
  return z
    .object({
      groups: z.array(z.object({ conditions: z.array(conditionShape) })),
    })
    .superRefine((values, ctx) => {
      values.groups.forEach((group, groupIndex) => {
        group.conditions.forEach((condition, conditionIndex) => {
          // A row nobody started filling in is simply left out.
          if (condition.property === '') {
            return;
          }
          const issue = conditionIssue(condition, byKey.get(condition.property));
          if (issue) {
            ctx.addIssue({
              code: 'custom',
              message: issue.message,
              path: ['groups', groupIndex, 'conditions', conditionIndex, issue.field],
            });
          }
        });
      });
    });
}

export const emptyCondition = (): ConditionDraft => ({ property: '', op: '', values: [] });

export const emptyGroup = (): GroupDraft => ({ conditions: [emptyCondition()] });

/** The list's filters as the builder starts from them; an empty list opens on one blank row. */
export function toBuilderValues(groups: readonly FilterGroup[]): FilterBuilderValues {
  if (groups.length === 0) {
    return { groups: [emptyGroup()] };
  }
  return {
    groups: groups.map((group) => ({
      conditions: group.conditions.map(({ property, op, values }) => ({
        property,
        op,
        values: [...values],
      })),
    })),
  };
}

/** What Apply hands back: the filled-in conditions, with groups left empty dropped. */
export function fromBuilderValues(draft: FilterBuilderValues): FilterGroup[] {
  return draft.groups
    .map((group) => ({
      id: newId(),
      conditions: group.conditions.flatMap(({ property, op, values }) =>
        op === '' ? [] : [{ id: newId(), property, op, values }],
      ),
    }))
    .filter((group) => group.conditions.length > 0);
}
