import { useCallback, useState } from 'react';

/** Manages create/edit dialog state for a CRUD list page. */
export function useCrudDialog<T>() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setOpen(true);
  }, []);

  const openEdit = useCallback((row: T) => {
    setEditing(row);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return { open, editing, openCreate, openEdit, close };
}
