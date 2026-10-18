import { useEffect } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { writeMemory } from './commsStore';

/**
 * Keeps a dock form's typed values for the panel's next mount (navigation remounts the page).
 * Without a panel key (the form is not in the dock) it does nothing.
 */
export function useFormMemory<T extends FieldValues>(
  methods: UseFormReturn<T>,
  panelKey: string | undefined,
  name: string,
) {
  useEffect(() => {
    if (!panelKey) {
      return undefined;
    }
    const subscription = methods.watch((values) => {
      writeMemory(panelKey, name, values);
    });
    return () => subscription.unsubscribe();
  }, [methods, panelKey, name]);
}
