import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Search param that puts a CRUD screen into its full-page create/edit view. */
export const CRUD_FORM_PARAM = 'form';

export type CrudFormMode = 'new' | 'edit';

/**
 * Owns the create/edit state of a CRUD list page.
 *
 * The mode lives in the URL (`?form=new` / `?form=edit`) so the browser's Back button
 * leaves the form rather than the portal. The row being edited is held in memory: it
 * comes from the grid, not from an id, so a reload lands back on the list.
 */
export function useCrudDialog<T>() {
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<T | null>(null);
  const mode = params.get(CRUD_FORM_PARAM);

  const setMode = useCallback(
    (next: CrudFormMode | null) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          if (next) {
            updated.set(CRUD_FORM_PARAM, next);
          } else {
            updated.delete(CRUD_FORM_PARAM);
          }
          return updated;
        },
        // Opening pushes so Back closes the form; closing replaces so Back does not reopen it.
        { replace: next === null },
      );
    },
    [setParams],
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setMode('new');
  }, [setMode]);

  const openEdit = useCallback(
    (row: T) => {
      setEditing(row);
      setMode('edit');
    },
    [setMode],
  );

  const close = useCallback(() => {
    setEditing(null);
    setMode(null);
  }, [setMode]);

  // A reloaded `?form=edit` has no row behind it — drop back to the list rather than
  // showing an edit form that would create a second record.
  useEffect(() => {
    if (mode === 'edit' && editing === null) {
      setMode(null);
    }
  }, [mode, editing, setMode]);

  const open = mode === 'new' || (mode === 'edit' && editing !== null);

  return { open, editing, openCreate, openEdit, close };
}
