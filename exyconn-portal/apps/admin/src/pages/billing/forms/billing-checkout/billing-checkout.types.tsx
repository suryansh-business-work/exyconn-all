import type { CheckoutProvider } from '@exyconn/shell/graphql/generated';

/** How a company pays for the plan it chose: the currency and the gateway. */
export interface BillingCheckoutFormValues {
  currency: string;
  provider: CheckoutProvider;
}
