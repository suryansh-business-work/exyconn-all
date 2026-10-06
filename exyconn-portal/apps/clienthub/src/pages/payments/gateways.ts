import { PaymentGateway } from '@exyconn/shell/graphql/generated';

/** What each payment gateway is called on the client hub's screens. */
export const GATEWAY_NAMES: Record<PaymentGateway, string> = {
  [PaymentGateway.Stripe]: 'Stripe',
  [PaymentGateway.Razorpay]: 'Razorpay',
  [PaymentGateway.Paypal]: 'PayPal',
  [PaymentGateway.Payoneer]: 'Payoneer',
};
