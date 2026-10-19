import type { ReactNode } from 'react';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@exyconn/shell/components/ui';
import {
  audienceSchema,
  toFormValues,
  type AudienceFormValues,
} from '../../../../../../src/pages/audiences/forms/audience-list/audience-list.types';

interface AudienceFormHarnessProps {
  /** Values that differ from a new audience's defaults. */
  values?: Partial<AudienceFormValues>;
  /** Receives the form on every render, so a test can read what a section wrote. */
  capture?: (methods: UseFormReturn<AudienceFormValues>) => void;
  onValid?: (values: AudienceFormValues) => void;
  children: ReactNode;
}

/**
 * One builder section inside the same form the audience builder uses — the real schema and
 * the real defaults — with a Check button that runs the validation.
 */
export function AudienceFormHarness({
  values,
  capture,
  onValid = () => undefined,
  children,
}: Readonly<AudienceFormHarnessProps>) {
  const methods = useForm<AudienceFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(audienceSchema),
    defaultValues: { ...toFormValues(null), ...values },
  });
  capture?.(methods);
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onValid)} noValidate>
        {children}
        <Button type="submit">Check</Button>
      </form>
    </FormProvider>
  );
}

/** Captures the harness form so a test can read its values afterwards. */
export function formProbe() {
  const probe: { methods?: UseFormReturn<AudienceFormValues> } = {};
  return {
    capture: (methods: UseFormReturn<AudienceFormValues>) => {
      probe.methods = methods;
    },
    values: (): AudienceFormValues => {
      if (!probe.methods) throw new Error('The harness has not rendered');
      return probe.methods.getValues();
    },
    methods: (): UseFormReturn<AudienceFormValues> => {
      if (!probe.methods) throw new Error('The harness has not rendered');
      return probe.methods;
    },
  };
}
