import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Box, Text } from '@/components/ui';
import { RhfSelect, RhfTextField, type SelectOption } from '@/components/form/rhf';
import { EntityForm } from '@/components/form/EntityForm';
import { useEntitySave } from '@/components/form/useEntitySave';
import { useCreateLeaveBalanceMutation, useUpdateLeaveBalanceMutation } from '@/graphql/generated';
import {
  availableOf,
  leaveBalanceSchema,
  toFormValues,
  type LeaveBalanceValues,
} from './leave-balance.schema';
import type { LeaveBalanceRow } from './leave-balance.types';

interface LeaveBalanceFormProps {
  employeeId: string;
  year: number;
  /** The balance being adjusted, or null to add a leave type the employee does not hold. */
  initial: LeaveBalanceRow | null;
  /** Leave types that can still be added; unused when adjusting. */
  typeOptions: SelectOption[];
  onDone: () => void;
  onCancel: () => void;
}

/** A whole number from a field that may still be mid-edit. */
const asDays = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** React Hook Form + Zod form for HR to add or adjust one employee's leave balance. */
export function LeaveBalanceForm({
  employeeId,
  year,
  initial,
  typeOptions,
  onDone,
  onCancel,
}: Readonly<LeaveBalanceFormProps>) {
  const t = useT();
  const [createLeaveBalance] = useCreateLeaveBalanceMutation();
  const [updateLeaveBalance] = useUpdateLeaveBalanceMutation();
  const methods = useForm<z.input<typeof leaveBalanceSchema>, unknown, LeaveBalanceValues>({
    resolver: zodResolver(leaveBalanceSchema),
    defaultValues: toFormValues(initial),
  });
  const [allocated, carriedForward, adjustment, used] = methods.watch([
    'allocated',
    'carriedForward',
    'adjustment',
    'used',
  ]);
  const available = availableOf({
    allocated: asDays(allocated),
    carriedForward: asDays(carriedForward),
    adjustment: asDays(adjustment),
    used: asDays(used),
  });

  const toInput = (values: LeaveBalanceValues) => ({ ...values, employeeId, year });
  const { isEdit, onSubmit } = useEntitySave({
    label: 'Leave balance',
    initial,
    create: (values: LeaveBalanceValues) =>
      createLeaveBalance({ variables: { input: toInput(values) } }),
    update: (row, values) =>
      updateLeaveBalance({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      {initial ? (
        <Text weight="medium">{t('{type} for {year}', { type: initial.leaveTypeCode, year })}</Text>
      ) : (
        <RhfSelect
          name="leaveTypeCode"
          label="Leave type"
          options={typeOptions}
          helperText={
            typeOptions.length ? undefined : 'They already hold every leave type HR offers.'
          }
        />
      )}
      <RhfTextField
        name="allocated"
        label="Allocated"
        type="number"
        helperText="Days the leave policy grants for the year."
      />
      <RhfTextField
        name="carriedForward"
        label="Carried forward"
        type="number"
        helperText="Unused days brought over from last year."
      />
      <RhfTextField
        name="adjustment"
        label="Adjustment"
        type="number"
        helperText="Add days with a positive number (2), take days away with a negative one (-1)."
      />
      <RhfTextField
        name="used"
        label="Used"
        type="number"
        helperText="Days already taken. Approvals keep this up to date — change it only to fix a mistake."
      />
      <Box role="status" sx={{ p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
        <Text weight="medium">
          {t('Available after saving: {count} days', { count: available })}
        </Text>
      </Box>
    </EntityForm>
  );
}
