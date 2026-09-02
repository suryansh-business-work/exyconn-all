import type { ReactNode } from 'react';
import {
  FormProvider,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';
import { Flex } from '@/components/ui';
import { FormActions } from './FormActions';

/** Vertical rhythm between fields, shared by every module form. */
const FIELD_SPACING = 2.5;

interface EntityFormProps<TInput extends FieldValues, TValues> {
  methods: UseFormReturn<TInput, unknown, TValues>;
  onSubmit: SubmitHandler<TValues>;
  isEdit: boolean;
  onCancel: () => void;
  /** Overrides the default Create/Update submit label (e.g. "Send", "Block"). */
  submitLabel?: string;
  children: ReactNode;
}

/**
 * The frame every module form shares: form context, the native `<form>` with native
 * validation off (Zod owns it), the field stack and the Cancel/Save footer. Fields go
 * in as children; the submit handler comes from {@link useEntitySave}.
 */
export function EntityForm<TInput extends FieldValues, TValues>({
  methods,
  onSubmit,
  isEdit,
  onCancel,
  submitLabel,
  children,
}: Readonly<EntityFormProps<TInput, TValues>>) {
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={FIELD_SPACING}>
          {children}
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={isEdit}
            onCancel={onCancel}
            submitLabel={submitLabel}
          />
        </Flex>
      </form>
    </FormProvider>
  );
}
