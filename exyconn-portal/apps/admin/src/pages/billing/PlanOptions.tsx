import { useFormatters, useT } from '@exyconn/i18n';
import { Button, Card, CardContent, Grid, Heading, Text } from '@exyconn/shell/components/ui';
import type { BillingPlanFieldsFragment } from '@exyconn/shell/graphql/generated';
import { intervalLabel, modulesLabel, seatsLabel } from './plan.facts';

interface PlanCardProps {
  plan: BillingPlanFieldsFragment;
  current: boolean;
  onChoose: (plan: BillingPlanFieldsFragment) => void;
}

/** One plan the company can move to: its prices, seats, modules and AI allowance. */
function PlanCard({ plan, current, onChoose }: Readonly<PlanCardProps>) {
  const t = useT();
  const { formatCurrency } = useFormatters();
  const prices = plan.prices
    .map((price) => formatCurrency(price.amount, { currency: price.currency }))
    .join(' · ');
  const ai =
    plan.aiMonthlyUsdCap === 0
      ? t('Unlimited AI')
      : t('{amount} of AI a month', {
          amount: formatCurrency(plan.aiMonthlyUsdCap, { currency: 'USD' }),
        });
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Heading level={6}>{plan.name}</Heading>
        <Text size="sm" color="text.secondary">
          {plan.description}
        </Text>
        <Text size="md" sx={{ mt: 1 }}>
          {prices || t('Free')} {prices ? intervalLabel(plan.interval, t) : ''}
        </Text>
        <Text size="sm">{seatsLabel(plan.seatLimit, t)}</Text>
        <Text size="sm">{modulesLabel(plan, t)}</Text>
        <Text size="sm">{ai}</Text>
        <Button sx={{ mt: 2 }} disabled={current || !prices} onClick={() => onChoose(plan)}>
          {current ? t('Current plan') : t('Choose')}
        </Button>
      </CardContent>
    </Card>
  );
}

interface PlanOptionsProps {
  plans: BillingPlanFieldsFragment[];
  currentPlanId: string | null;
  onChoose: (plan: BillingPlanFieldsFragment) => void;
}

/** The public plans, side by side on a wide screen and stacked on a phone. */
export function PlanOptions({ plans, currentPlanId, onChoose }: Readonly<PlanOptionsProps>) {
  return (
    <Grid container spacing={2}>
      {plans.map((plan) => (
        <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <PlanCard plan={plan} current={plan.id === currentPlanId} onChoose={onChoose} />
        </Grid>
      ))}
    </Grid>
  );
}
