import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import {
  SubscriptionStatus,
  useAssignOrganizationPlanMutation,
  useBillingPlansQuery,
  useOrganizationSubscriptionQuery,
} from '@exyconn/shell/graphql/generated';
import { STATUS_LABELS } from '../../../billing/plan.facts';
import type { OrganizationPlanFormValues } from './organization-plan.types';

const schema = z.object({
  planId: z.string().min(1, 'Pick a plan'),
  status: z.enum(SubscriptionStatus),
});

interface OrganizationPlanFormProps {
  organizationId: string;
  organizationName: string;
  onDone: () => void;
  onCancel: () => void;
}

interface PlanFieldsProps extends OrganizationPlanFormProps {
  initial: OrganizationPlanFormValues;
  planOptions: { value: string; label: string }[];
}

/** The form once the plans and the company's current subscription have loaded. */
function OrganizationPlanFields({
  organizationId,
  organizationName,
  onDone,
  onCancel,
  initial,
  planOptions,
}: Readonly<PlanFieldsProps>) {
  const t = useT();
  const [assign] = useAssignOrganizationPlanMutation();
  const methods = useForm<OrganizationPlanFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: initial,
  });
  const statusOptions = Object.values(SubscriptionStatus).map((status) => ({
    value: status,
    label: t(STATUS_LABELS[status]),
  }));
  const { onSubmit } = useEntitySave({
    label: 'Plan for {organization}',
    labelValues: { organization: organizationName },
    initial: null,
    create: (values: OrganizationPlanFormValues) =>
      assign({ variables: { organizationId, ...values } }),
    update: () => Promise.resolve(),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={false} onCancel={onCancel}>
      <RhfSelect
        name="planId"
        label="Plan"
        required
        options={planOptions}
        helperText="Its limits apply to the company within a minute."
      />
      <RhfSelect
        name="status"
        label="Status"
        required
        options={statusOptions}
        helperText="Set by hand: no gateway collects for it. Cancel any gateway subscription there."
      />
    </EntityForm>
  );
}

/** Puts a company on a plan by hand — an invoiced deal or a courtesy extension (SUPER_ADMIN). */
export function OrganizationPlanForm(props: Readonly<OrganizationPlanFormProps>) {
  const plans = useBillingPlansQuery();
  const current = useOrganizationSubscriptionQuery({
    variables: { organizationId: props.organizationId },
    fetchPolicy: 'network-only',
  });
  if (plans.loading || current.loading) {
    return <LoadingState />;
  }
  const subscription = current.data?.organizationSubscription;
  const planOptions = (plans.data?.billingPlans ?? []).map((plan) => ({
    value: plan.id,
    label: plan.name,
  }));
  return (
    <OrganizationPlanFields
      {...props}
      planOptions={planOptions}
      initial={{
        planId: subscription?.planId ?? '',
        status: subscription?.status ?? SubscriptionStatus.Active,
      }}
    />
  );
}
