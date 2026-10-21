import type { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
import { fieldMeta } from '../schemaMeta';
import { schemaOfResolver } from '../zodResolver';

interface Given<Hint extends ReactNode> {
  /** What the field was given; either wins over what the schema says. */
  required?: boolean;
  helperText?: Hint;
}

/**
 * Whether a field is required and what its hint is: what the field was given, else what the
 * form's Zod schema says — required when it refuses an empty value, the hint from
 * `.describe()`. So the red star appears on exactly the fields the form will not save empty.
 */
export function useFieldMeta<Hint extends ReactNode = string>(
  name: string,
  given: Given<Hint> = {},
): { required: boolean; helperText: Hint | string | undefined } {
  const { control } = useFormContext();
  const meta = fieldMeta(schemaOfResolver(control._options.resolver), name);
  return {
    required: given.required ?? meta.required,
    helperText: given.helperText ?? meta.description,
  };
}
