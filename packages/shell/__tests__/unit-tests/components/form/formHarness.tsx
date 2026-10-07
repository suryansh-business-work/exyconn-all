import type { ReactNode } from 'react';
import {
  FormProvider,
  useForm,
  type DefaultValues,
  type FieldValues,
  type Resolver,
  type UseFormReturn,
} from 'react-hook-form';

interface FormHarnessProps<T extends FieldValues> {
  defaultValues: DefaultValues<T>;
  children: ReactNode;
  resolver?: Resolver<T>;
  onSubmit?: (values: T) => void;
  /** Hands the test the form, to set an error or read a value the way a page would. */
  onMethods?: (methods: UseFormReturn<T>) => void;
}

/**
 * A bare React Hook Form around the fields under test: the live values are printed so a test
 * reads what the field wrote back, and a Submit button runs validation.
 */
export function FormHarness<T extends FieldValues>({
  defaultValues,
  children,
  resolver,
  onSubmit = () => undefined,
  onMethods,
}: Readonly<FormHarnessProps<T>>) {
  const methods = useForm<T>({ defaultValues, resolver });
  onMethods?.(methods);
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        {children}
        <button type="submit">Submit</button>
        <pre data-testid="form-values">{JSON.stringify(methods.watch())}</pre>
      </form>
    </FormProvider>
  );
}

/** The form's current values, as the harness printed them. */
export function formValues(): Record<string, unknown> {
  const text = document.querySelector('[data-testid="form-values"]')?.textContent ?? '{}';
  return JSON.parse(text) as Record<string, unknown>;
}
