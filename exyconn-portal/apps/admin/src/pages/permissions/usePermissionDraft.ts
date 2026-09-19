import { useCallback, useMemo, useState } from 'react';
import type { PermissionAction } from '@exyconn/shell/graphql/generated';
import {
  ACTIONS,
  effectiveActions,
  fillsOnToggle,
  sameActions,
  tickState,
  toggleAction,
  type TickState,
} from './permissions.logic';

/**
 * The matrix being edited: what each module allows now, and only the rows someone has
 * changed. A row changed back to what is stored stops being a change, so the save bar never
 * counts an edit that edits nothing.
 */
export function usePermissionDraft(
  modules: readonly string[],
  saved: ReadonlyMap<string, readonly PermissionAction[]>,
) {
  const [drafts, setDrafts] = useState<ReadonlyMap<string, PermissionAction[]>>(new Map());

  const stored = useCallback((module: string) => effectiveActions(saved.get(module)), [saved]);
  const current = useCallback(
    (module: string): readonly PermissionAction[] => drafts.get(module) ?? stored(module),
    [drafts, stored],
  );

  const setRows = useCallback(
    (changes: ReadonlyArray<[string, PermissionAction[]]>) =>
      setDrafts((previous) => {
        const next = new Map(previous);
        for (const [module, actions] of changes) {
          if (sameActions(actions, stored(module))) next.delete(module);
          else next.set(module, actions);
        }
        return next;
      }),
    [stored],
  );

  const columnState = useCallback(
    (action: PermissionAction): TickState =>
      tickState(modules.filter((m) => current(m).includes(action)).length, modules.length),
    [modules, current],
  );

  return useMemo(
    () => ({
      current,
      dirty: [...drafts.keys()],
      isDirty: (module: string) => drafts.has(module),
      rowState: (module: string) => tickState(current(module).length, ACTIONS.length),
      columnState,
      toggleCell: (module: string, action: PermissionAction) =>
        setRows([[module, toggleAction(current(module), action)]]),
      toggleRow: (module: string) => {
        const fill = fillsOnToggle(tickState(current(module).length, ACTIONS.length));
        setRows([[module, fill ? [...ACTIONS] : []]]);
      },
      toggleColumn: (action: PermissionAction) => {
        const fill = fillsOnToggle(columnState(action));
        setRows(
          modules.map((module) => {
            const has = current(module).includes(action);
            return [
              module,
              has === fill ? [...current(module)] : toggleAction(current(module), action),
            ];
          }),
        );
      },
      discard: () => setDrafts(new Map()),
      forget: (module: string) =>
        setDrafts((previous) => {
          const next = new Map(previous);
          next.delete(module);
          return next;
        }),
    }),
    [drafts, current, columnState, modules, setRows],
  );
}

export type PermissionDraft = ReturnType<typeof usePermissionDraft>;
