import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n, useT } from '@exyconn/i18n';
import { Alert, Button, Heading, Stack } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  SubscriptionStatus,
  useBillingOverviewQuery,
  useCancelBillingSubscriptionMutation,
  type BillingPlanFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { SubscriptionSummary } from './SubscriptionSummary';
import { PlanOptions } from './PlanOptions';
import { BillingCheckoutForm } from './forms/billing-checkout';

/** What the gateway sent the administrator back with: paid (pending its webhook) or not. */
function CheckoutReturn({ outcome }: Readonly<{ outcome: string | null }>) {
  const t = useT();
  if (outcome === 'done') {
    return (
      <Alert severity="success">
        {t('Payment received. Your plan updates as soon as the provider confirms it.')}
      </Alert>
    );
  }
  if (outcome === 'cancelled') {
    return <Alert severity="info">{t('Checkout cancelled. Nothing was charged.')}</Alert>;
  }
  return null;
}

/**
 * Admin › Billing: the company's plan, its status and use against the plan's limits, the plans
 * it can move to (paid through Stripe or Razorpay), and cancelling.
 */
export function BillingPage() {
  const t = useT();
  const { settings } = useI18n();
  const [params] = useSearchParams();
  const confirm = useConfirm();
  const notify = useNotify();
  const { data, loading, error, refetch } = useBillingOverviewQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [cancelSubscription, { loading: cancelling }] = useCancelBillingSubscriptionMutation();
  const [choosing, setChoosing] = useState<BillingPlanFieldsFragment | null>(null);

  if (loading && !data) {
    return <LoadingState />;
  }
  const overview = data?.billingOverview;
  if (!overview) {
    return <Alert severity="error">{errorMessage(error, t('Billing could not be loaded'))}</Alert>;
  }
  const subscription = overview.subscription;
  const cancellable =
    subscription !== null &&
    subscription !== undefined &&
    subscription.status !== SubscriptionStatus.Cancelled &&
    !subscription.cancelAtPeriodEnd;

  const cancel = async () => {
    const ok = await confirm({
      title: 'Cancel subscription',
      message:
        'A paid plan ends when the period already paid for runs out; a trial ends now. Modules outside Admin and My Workspace close then.',
      confirmText: 'Cancel subscription',
    });
    if (!ok) return;
    try {
      await cancelSubscription();
      notify('Subscription cancelled', 'success');
      await refetch();
    } catch (err) {
      notify(errorMessage(err, t('Could not cancel the subscription')), 'error');
    }
  };

  return (
    <Stack spacing={2}>
      <PageHeader title="Billing" subtitle="Your plan, what it includes and how you pay for it" />
      <CheckoutReturn outcome={params.get('checkout')} />
      {overview.lapsed && (
        <Alert severity="warning">
          {t('Your subscription has ended. Choose a plan to open your modules again.')}
        </Alert>
      )}
      <SubscriptionSummary overview={overview} />
      <Heading level={5}>{t('Plans')}</Heading>
      <PlanOptions
        plans={overview.plans}
        currentPlanId={overview.lapsed ? null : (overview.plan?.id ?? null)}
        onChoose={setChoosing}
      />
      {cancellable && (
        <Stack direction="row">
          <Button color="error" variant="outlined" disabled={cancelling} onClick={cancel}>
            {t('Cancel subscription')}
          </Button>
        </Stack>
      )}
      <CrudDialog
        open={choosing !== null}
        title={choosing ? t('Subscribe to {plan}', { plan: choosing.name }) : t('Subscribe')}
        onClose={() => setChoosing(null)}
      >
        {choosing ? (
          <BillingCheckoutForm
            plan={choosing}
            providers={overview.providers}
            preferredCurrency={settings.currency}
            onCancel={() => setChoosing(null)}
          />
        ) : null}
      </CrudDialog>
    </Stack>
  );
}
