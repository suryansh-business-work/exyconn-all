import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import { countryOptions, useI18n, useT } from '@exyconn/i18n';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { Alert, Button, Flex, readableInk } from '@exyconn/shell/components/ui';
import {
  RhfAutocomplete,
  RhfCurrencyField,
  RhfSelect,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { currencyField } from '@exyconn/shell/utils/currencyField';
import {
  useRequestSignupCodeMutation,
  type BillingPlanFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import type { SignupFormValues } from './signup.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Your name is required').max(120, 'Keep it under 120 characters'),
  email: z.string().trim().min(1, 'Email is required').regex(EMAIL, 'Enter a valid email'),
  companyName: z
    .string()
    .trim()
    .min(2, 'Company name is required')
    .max(120, 'Keep it under 120 characters'),
  currency: currencyField,
  country: z.string().trim().length(2, 'Pick a country from the list').or(z.literal('')),
  planId: z.string().min(1, 'Pick a plan'),
});

interface SignupFormProps {
  plans: BillingPlanFieldsFragment[];
  accentColor: string;
  /** Called once the code has been emailed, with what was entered. */
  onCodeSent: (values: SignupFormValues) => void;
}

/** A plan as the picker shows it: its name and how long its free trial is. */
function planLabel(plan: BillingPlanFieldsFragment, t: ReturnType<typeof useT>): string {
  if (plan.trialDays === 0) {
    return plan.name;
  }
  return t('{plan} — {days}-day free trial', { plan: plan.name, days: plan.trialDays });
}

/** Step one of a company sign-up: who is signing up, the company, and the plan to try. */
export function SignupForm({ plans, accentColor, onCodeSent }: Readonly<SignupFormProps>) {
  const t = useT();
  const { locale } = useI18n();
  const [requestCode] = useRequestSignupCodeMutation();
  const [error, setError] = useState<string | null>(null);
  const methods = useForm<SignupFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      companyName: '',
      currency: '',
      country: '',
      planId: plans[0]?.id ?? '',
    },
  });
  const countries = useMemo(
    () => countryOptions(locale).map((option) => ({ value: option.code, label: option.label })),
    [locale],
  );
  const planOptions = plans.map((plan) => ({ value: plan.id, label: planLabel(plan, t) }));

  const onSubmit = async (values: SignupFormValues) => {
    setError(null);
    try {
      await requestCode({ variables: { email: values.email } });
      onCodeSent(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('The code could not be sent'));
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={1.5}>
          {error && <Alert severity="error">{t(error)}</Alert>}
          <RhfTextField name="name" label="Your name" autoComplete="name" />
          <RhfTextField
            name="email"
            label="Work email"
            type="email"
            autoComplete="email"
            helperText="We email a code here; it becomes your sign-in."
          />
          <RhfTextField name="companyName" label="Company name" autoComplete="organization" />
          <RhfCurrencyField
            defaultToCompany={false}
            helperText="The money your books are kept in."
          />
          <RhfAutocomplete name="country" label="Country" options={countries} />
          <RhfSelect
            name="planId"
            label="Plan"
            required
            options={planOptions}
            helperText="You can change plans any time in Admin › Billing."
          />
          <Button
            type="submit"
            fullWidth
            disabled={methods.formState.isSubmitting}
            sx={{ bgcolor: accentColor, color: readableInk(accentColor) }}
          >
            {t('Email me a code')}
          </Button>
        </Flex>
      </form>
    </FormProvider>
  );
}
