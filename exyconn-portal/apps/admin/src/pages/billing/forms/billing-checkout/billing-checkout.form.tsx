import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useFormatters, useT } from '@exyconn/i18n';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { Alert, Button, Flex } from '@exyconn/shell/components/ui';
import { RhfSelect } from '@exyconn/shell/components/form/rhf';
import {
  CheckoutProvider,
  useStartBillingCheckoutMutation,
  type BillingPlanFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import type { BillingCheckoutFormValues } from './billing-checkout.types';

const schema = z.object({
  currency: z.string().trim().min(1, 'Pick a currency'),
  provider: z.enum(CheckoutProvider, { error: 'Pick how to pay' }),
});

/** Each gateway as people know it. */
const PROVIDER_LABELS: Record<CheckoutProvider, string> = {
  [CheckoutProvider.Stripe]: 'Card (Stripe)',
  [CheckoutProvider.Razorpay]: 'Card, UPI or netbanking (Razorpay)',
};

interface BillingCheckoutFormProps {
  plan: BillingPlanFieldsFragment;
  providers: CheckoutProvider[];
  /** The company's own currency, picked first when the plan is sold in it. */
  preferredCurrency: string;
  onCancel: () => void;
}

/**
 * Sends the administrator to the gateway's hosted checkout for a plan. Nothing changes here:
 * the plan switches when the gateway confirms the payment (its signed webhook).
 */
export function BillingCheckoutForm({
  plan,
  providers,
  preferredCurrency,
  onCancel,
}: Readonly<BillingCheckoutFormProps>) {
  const t = useT();
  const { formatCurrency } = useFormatters();
  const [startCheckout] = useStartBillingCheckoutMutation();
  const [error, setError] = useState<string | null>(null);
  const preferred = plan.prices.find((price) => price.currency === preferredCurrency);
  const methods = useForm<BillingCheckoutFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: {
      currency: preferred?.currency ?? plan.prices[0]?.currency ?? '',
      provider: providers[0],
    },
  });
  const currencyOptions = plan.prices.map((price) => ({
    value: price.currency,
    label: formatCurrency(price.amount, { currency: price.currency }),
  }));
  const providerOptions = providers.map((provider) => ({
    value: provider,
    label: PROVIDER_LABELS[provider],
  }));

  const onSubmit = async (values: BillingCheckoutFormValues) => {
    setError(null);
    try {
      const { data } = await startCheckout({
        variables: { input: { planId: plan.id, ...values } },
      });
      if (data?.startBillingCheckout) {
        globalThis.location.assign(data.startBillingCheckout);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('The checkout could not be opened'));
    }
  };

  if (providers.length === 0) {
    return (
      <Alert severity="info">
        {t('Online payment is not set up yet. Contact us to change your plan.')}
      </Alert>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={1.5}>
          {error && <Alert severity="error">{t(error)}</Alert>}
          <RhfSelect
            name="currency"
            label="Price"
            required
            options={currencyOptions}
            helperText="Charged every billing period in this currency."
          />
          <RhfSelect
            name="provider"
            label="Pay with"
            required
            options={providerOptions}
            helperText="You finish paying on the provider's secure page."
          />
          <Flex direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="text" onClick={onCancel}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={methods.formState.isSubmitting}>
              {t('Continue to payment')}
            </Button>
          </Flex>
        </Flex>
      </form>
    </FormProvider>
  );
}
