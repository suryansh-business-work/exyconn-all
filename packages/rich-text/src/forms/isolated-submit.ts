import type { SyntheticEvent } from 'react';
import type { FieldValues, SubmitHandler, UseFormReturn } from 'react-hook-form';

/**
 * Submit handler for a dialog form that lives inside another form. MUI portals the
 * dialog out of the host `<form>` in the DOM, but React still bubbles the synthetic
 * submit event up the component tree — so without stopping it here, "Add link" would
 * also submit the article form the editor sits in.
 */
export function isolatedSubmit<TValues extends FieldValues>(
  methods: UseFormReturn<TValues>,
  onValid: SubmitHandler<TValues>,
) {
  return (event: SyntheticEvent<HTMLFormElement>) => {
    event.stopPropagation();
    return methods.handleSubmit(onValid)(event);
  };
}
