import type { ControllerFieldState } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import type { CustomPropertyDef } from './custom-fields.schema';

export interface FieldProps {
  property: CustomPropertyDef;
  /** The form path, `custom.<key>`. */
  name: string;
}

/**
 * The hint under a field: the error when there is one, else the property's help text. The
 * label and help text are the company's own words, so they are shown as typed; the error is
 * one of the form's English sources and is translated.
 */
export function useHint() {
  const t = useT();
  return (property: CustomPropertyDef, fieldState: ControllerFieldState) =>
    fieldState.error?.message ? t(fieldState.error.message) : property.description;
}
