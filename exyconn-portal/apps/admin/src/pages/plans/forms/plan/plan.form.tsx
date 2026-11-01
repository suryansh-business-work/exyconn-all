import { useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import {
  RhfMultiSelect,
  RhfSelect,
  RhfSwitch,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { ROLE_LABELS, ROLES } from '@exyconn/shell/auth/roles';
import {
  PlanInterval,
  useCreateBillingPlanMutation,
  useUpdateBillingPlanMutation,
} from '@exyconn/shell/graphql/generated';
import { PlanPriceFields } from './plan-prices.fields';
import { planSchema, toPlanValues } from './plan.schema';
import type { PlanRow } from './plan.types';

type Values = z.infer<typeof planSchema>;

/** Every plan opens Admin and My Workspace; the platform's role is never sold. */
const ALWAYS_OPEN = new Set<string>([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE]);

const MODULE_OPTIONS = Object.entries(ROLE_LABELS)
  .filter(([role]) => !ALWAYS_OPEN.has(role))
  .map(([value, label]) => ({ value, label }));

const INTERVAL_OPTIONS = [
  { value: PlanInterval.Month, label: 'Monthly' },
  { value: PlanInterval.Year, label: 'Yearly' },
];

interface PlanFormProps {
  initial: PlanRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** A plan's price, trial, limits and modules (Admin › Plans, SUPER_ADMIN). */
export function PlanForm({ initial, onDone, onCancel }: Readonly<PlanFormProps>) {
  const [createPlan] = useCreateBillingPlanMutation();
  const [updatePlan] = useUpdateBillingPlanMutation();
  const methods = useForm<z.input<typeof planSchema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(planSchema),
    defaultValues: toPlanValues(initial),
  });
  const allModules = useWatch({ control: methods.control, name: 'allModules' });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Plan',
    initial,
    create: (input: Values) => createPlan({ variables: { input } }),
    update: (row, input) => updatePlan({ variables: { id: row.id, input } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" helperText="What companies see, e.g. Growth." />
      <RhfTextField
        name="key"
        label="Key"
        disabled={isEdit}
        helperText="A fixed handle, e.g. growth. It cannot change once the plan exists."
      />
      <RhfTextField
        name="description"
        label="Description"
        multiline
        rows={2}
        helperText="Optional. One line on who the plan is for."
      />
      <PlanPriceFields />
      <RhfSelect name="interval" label="Billed" required options={INTERVAL_OPTIONS} />
      <RhfTextField
        name="trialDays"
        label="Trial days"
        type="number"
        helperText="Free days a new sign-up gets, 0 to 365."
      />
      <RhfTextField
        name="seatLimit"
        label="Seats"
        type="number"
        helperText="Active people a company may have. 0 is unlimited."
      />
      <RhfSwitch name="allModules" label="Include every module" />
      {allModules ? null : (
        <RhfMultiSelect
          name="modules"
          label="Modules"
          options={MODULE_OPTIONS}
          helperText="The portals it opens. Admin and My Workspace are always included."
        />
      )}
      <RhfTextField
        name="aiMonthlyUsdCap"
        label="AI per month (USD)"
        type="number"
        helperText="AI spend a company may run up each month. 0 is unlimited."
      />
      <RhfSwitch name="isPublic" label="Offer on the sign-up page" />
      <RhfSwitch name="isActive" label="Open to new subscribers" />
      <RhfTextField
        name="sortOrder"
        label="Order"
        type="number"
        helperText="Lower numbers are listed first."
      />
    </EntityForm>
  );
}
