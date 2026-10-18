import { CrmOp, CrmPropertyType } from '@exyconn/shell/graphql/generated';
import { newId, type FilterCondition, type FilterGroup } from '../list/recordQuery';
import type { CrmPropertyInfo } from '../schema';

/** The filter-only Yes/No checks a record type offers (Has email, Has phone): the quick toggles. */
export const presenceProperties = (properties: readonly CrmPropertyInfo[]): CrmPropertyInfo[] =>
  properties.filter((property) => property.filterOnly && property.type === CrmPropertyType.Boolean);

const isPresent = (condition: FilterCondition, key: string) =>
  condition.property === key && condition.op === CrmOp.Eq && condition.values[0] === 'true';

/** Whether every OR group requires the check — the toggle's "on" state. */
export function hasPresence(groups: readonly FilterGroup[], key: string): boolean {
  return (
    groups.length > 0 &&
    groups.every((group) => group.conditions.some((condition) => isPresent(condition, key)))
  );
}

const presentCondition = (key: string): FilterCondition => ({
  id: newId(),
  property: key,
  op: CrmOp.Eq,
  values: ['true'],
});

/**
 * The groups with the check required in every one (AND with whatever each group already asks,
 * replacing any other condition on the same key), or taken out of every one, dropping a group
 * it leaves empty. With no groups yet, turning it on starts one.
 */
export function withPresence(
  groups: readonly FilterGroup[],
  key: string,
  on: boolean,
): FilterGroup[] {
  const rest = groups.map((group) => ({
    ...group,
    conditions: group.conditions.filter((condition) => condition.property !== key),
  }));
  if (!on) {
    return rest.filter((group) => group.conditions.length > 0);
  }
  if (rest.length === 0) {
    return [{ id: newId(), conditions: [presentCondition(key)] }];
  }
  return rest.map((group) => ({
    ...group,
    conditions: [...group.conditions, presentCondition(key)],
  }));
}
