import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  LeaveType,
  useActiveLeavePoliciesQuery,
  useApplyLeaveMutation,
} from '@exyconn/shell/graphql/generated';

const schema = z
  .object({
    type: z.nativeEnum(LeaveType),
    fromDate: z.string().min(1, 'From date is required'),
    toDate: z.string().min(1, 'To date is required'),
    reason: z.string().trim().min(1, 'Reason is required').min(3, 'Add a brief reason'),
  })
  .refine((d) => !d.fromDate || !d.toDate || new Date(d.toDate) >= new Date(d.fromDate), {
    path: ['toDate'],
    message: 'To date must be on or after the from date',
  });
type Values = z.infer<typeof schema>;

const INITIAL: Values = { type: LeaveType.Casual, fromDate: '', toDate: '', reason: '' };
const ALL_TYPES = Object.values(LeaveType);

/**
 * The leave types on offer: those whose code HR has an active policy for, or every
 * type when no policy has been set up yet. Policy codes are free text, so the
 * match is case-insensitive.
 */
export function offeredLeaveTypes(policyCodes: readonly string[]): LeaveType[] {
  if (policyCodes.length === 0) return ALL_TYPES;
  const codes = new Set(policyCodes.map((code) => code.toUpperCase()));
  return ALL_TYPES.filter((type) => codes.has(type.toUpperCase()));
}

/** React Hook Form + Zod form for an employee to apply for leave (status set to PENDING). */
export function ApplyLeaveForm({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const notify = useNotify();
  const [applyLeave] = useApplyLeaveMutation();
  const { data: policies } = useActiveLeavePoliciesQuery();
  const methods = useForm<Values>({ resolver: zodResolver(schema), defaultValues: INITIAL });

  const offered = useMemo(
    () => offeredLeaveTypes((policies?.activeLeavePolicies ?? []).map((p) => p.code)),
    [policies],
  );
  const selected = methods.watch('type');
  // Policies arrive after the form mounts; keep the selection on something offered.
  useEffect(() => {
    if (offered.length > 0 && !offered.includes(selected)) {
      methods.setValue('type', offered[0]);
    }
  }, [offered, selected, methods]);

  const onSubmit = async (values: Values) => {
    try {
      await applyLeave({ variables: { input: values } });
      notify('Leave applied — pending approval');
      methods.reset();
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not apply for leave', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Apply"
    >
      <RhfSelect name="type" label="Leave type" options={enumOptions(offered)} />
      <RhfDatePicker name="fromDate" label="From date" />
      <RhfDatePicker name="toDate" label="To date" />
      <RhfTextField name="reason" label="Reason" multiline minRows={2} />
    </EntityForm>
  );
}
