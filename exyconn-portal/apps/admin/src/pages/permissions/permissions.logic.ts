import { PermissionAction } from '@exyconn/shell/graphql/generated';

/** The columns, in the order people think about access: see it, change it, sign it off. */
export const ACTIONS: readonly PermissionAction[] = [
  PermissionAction.View,
  PermissionAction.Create,
  PermissionAction.Edit,
  PermissionAction.Delete,
  PermissionAction.Approve,
  PermissionAction.Export,
];

/** How much of a row or column is ticked — drives the checkbox and its half-ticked state. */
export type TickState = 'all' | 'some' | 'none';

/** What a module allows as stored: no restriction on record means everything. */
export const effectiveActions = (saved: readonly PermissionAction[] | undefined) =>
  saved ?? ACTIONS;

/** Order-blind equality of two action lists. */
export function sameActions(
  a: readonly PermissionAction[],
  b: readonly PermissionAction[],
): boolean {
  return a.length === b.length && a.every((action) => b.includes(action));
}

export function tickState(ticked: number, total: number): TickState {
  if (ticked === 0) return 'none';
  return ticked === total ? 'all' : 'some';
}

/** Adds the action if it is missing, removes it if present; keeps the column order. */
export function toggleAction(
  actions: readonly PermissionAction[],
  action: PermissionAction,
): PermissionAction[] {
  const next = new Set(actions);
  if (next.has(action)) next.delete(action);
  else next.add(action);
  return ACTIONS.filter((a) => next.has(a));
}

/** A half- or un-ticked row or column fills up; a full one empties. */
export const fillsOnToggle = (state: TickState): boolean => state !== 'all';

/**
 * What saving a row sends: every action is the same as no restriction, so it goes back to the
 * default rather than storing a list that would silently miss an action added later.
 */
export function saveOperation(actions: readonly PermissionAction[]): 'reset' | 'restrict' {
  return sameActions(actions, ACTIONS) ? 'reset' : 'restrict';
}

/** A row's status, in words, for the chip beside the module's name. */
export function rowStatus(
  restricted: boolean,
  dirty: boolean,
): 'Unsaved' | 'Restricted' | 'Default' {
  if (dirty) return 'Unsaved';
  return restricted ? 'Restricted' : 'Default';
}
