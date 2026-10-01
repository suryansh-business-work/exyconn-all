import { get, useFormContext } from 'react-hook-form';
import { FormHelperText } from '@/components/ui';
import { useFieldCopy } from './useFieldCopy';

interface RhfFieldArrayErrorProps {
  /** The field array's name, e.g. `lines` or `tasks`. */
  name: string;
}

/**
 * The message for a rule about a field array AS A WHOLE — "Add at least one line", "Two
 * tasks cannot have the same wording" — which no single row's field can ever show.
 *
 * Without it such a rule is invisible: it blocks the submit, the button appears to do
 * nothing, and nobody is told why. Zod reports the issue at the array's own path, where
 * React Hook Form keeps it next to the row errors — under `root` once the array has rows,
 * and on the array node itself while it is empty — so both are read.
 */
export function RhfFieldArrayError({ name }: Readonly<RhfFieldArrayErrorProps>) {
  const {
    formState: { errors },
  } = useFormContext();
  const copy = useFieldCopy();
  const error = get(errors, name) as { message?: string; root?: { message?: string } } | undefined;
  const message = error?.root?.message ?? error?.message;

  if (!message) {
    return null;
  }
  // role="alert" so it is announced when it appears, which is on submit rather than on load.
  return (
    <FormHelperText error role="alert">
      {copy(message)}
    </FormHelperText>
  );
}
