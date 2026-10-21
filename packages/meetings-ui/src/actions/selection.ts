import { createContext, useContext } from 'react';

/** The rows ticked for a bulk update, shared with the grid's checkbox cells. */
export interface ActionSelection {
  selected: ReadonlySet<string>;
  toggle: (id: string) => void;
}

export const ActionSelectionContext = createContext<ActionSelection>({
  selected: new Set(),
  toggle: () => undefined,
});

/** The checklist's current selection, from inside a grid cell. */
export function useActionSelection(): ActionSelection {
  return useContext(ActionSelectionContext);
}
