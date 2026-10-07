import type { ReactNode } from 'react';
import { FormProvider, useForm, type FieldPath } from 'react-hook-form';
import type { DesignSystemFormValues } from '../../../../../../src/pages/website/forms/cms-design-system';

/** A design system with every token group empty; tests fill in what they need. */
export const EMPTY_DESIGN: DesignSystemFormValues = {
  name: 'Brand',
  palette: [],
  colorsLight: [],
  colorsDark: [],
  fonts: [],
  radii: [],
  shadows: [],
  spacing: [],
  fontSources: [],
  extraCss: '',
};

export interface FieldError {
  name: FieldPath<DesignSystemFormValues>;
  message: string;
}

interface DesignHarnessProps {
  values?: Partial<DesignSystemFormValues>;
  /** Raised on the fields by the "Show errors" button, as the schema would on submit. */
  errors?: readonly FieldError[];
  /** Receives the form's values from the "Save" button. */
  onSubmit?: (values: DesignSystemFormValues) => void;
  children: ReactNode;
}

/**
 * The design-system form context the editor's parts read (they render inside DesignSystemForm),
 * without its resolver, so a test controls exactly which errors appear.
 */
export function DesignHarness({
  values,
  errors = [],
  onSubmit = () => undefined,
  children,
}: Readonly<DesignHarnessProps>) {
  const methods = useForm<DesignSystemFormValues>({
    defaultValues: { ...EMPTY_DESIGN, ...values },
  });
  const showErrors = () => {
    errors.forEach((error) => methods.setError(error.name, { message: error.message }));
  };
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {children}
        <button type="button" onClick={showErrors}>
          Show errors
        </button>
        <button type="submit">Save</button>
      </form>
    </FormProvider>
  );
}
