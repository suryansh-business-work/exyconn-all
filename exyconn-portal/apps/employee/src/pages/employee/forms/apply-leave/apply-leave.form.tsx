import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Grid, Text } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { leaveTypeOptions } from '@exyconn/shell/utils/leaveTypeOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useActiveLeavePoliciesQuery,
  useApplyLeaveMutation,
} from '@exyconn/shell/graphql/generated';
import { LeaveBalanceAside } from './LeaveBalanceAside';
import { leaveDays } from './apply-leave.days';

const schema = z
  .object({
    type: z.string().min(1, 'Choose a leave type'),
    fromDate: z.string().min(1, 'From date is required'),
    toDate: z.string().min(1, 'To date is required'),
    reason: z.string().trim().min(1, 'Reason is required').min(3, 'Add a brief reason'),
  })
  .refine((d) => !d.fromDate || !d.toDate || new Date(d.toDate) >= new Date(d.fromDate), {
    path: ['toDate'],
    message: 'To date must be on or after the from date',
  });
type Values = z.infer<typeof schema>;

const INITIAL: Values = { type: '', fromDate: '', toDate: '', reason: '' };

interface ApplyLeaveFormProps {
  onCancel: () => void;
  onDone: () => void;
}

/**
 * React Hook Form + Zod form for an employee to apply for leave (status set to PENDING), with
 * their balances beside it so they can see what the request uses before sending it.
 */
export function ApplyLeaveForm({ onCancel, onDone }: Readonly<ApplyLeaveFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [applyLeave] = useApplyLeaveMutation();
  // Only the leave types HR offers in this employee's country, on that country's terms.
  const { data: policies, loading } = useActiveLeavePoliciesQuery();
  const methods = useForm<Values>({ resolver: zodResolver(schema), defaultValues: INITIAL });

  const offered = useMemo(() => leaveTypeOptions(policies?.activeLeavePolicies ?? []), [policies]);
  const names = useMemo(
    () => new Map((policies?.activeLeavePolicies ?? []).map((p) => [p.code, p.name])),
    [policies],
  );
  const noneOffered = !loading && offered.length === 0;

  const [type, fromDate, toDate] = methods.watch(['type', 'fromDate', 'toDate']);
  const days = leaveDays(fromDate, toDate);

  // Moving the start past the end would leave an end nobody can pick again: clear it instead.
  useEffect(() => {
    if (fromDate && toDate && new Date(toDate) < new Date(fromDate)) {
      methods.setValue('toDate', '');
    }
  }, [fromDate, toDate, methods]);

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

  let typeHint: string | undefined;
  if (loading) typeHint = 'Loading your leave types…';
  else if (noneOffered) typeHint = 'HR has not set up any leave types for your country yet.';

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 7 }}>
        <EntityForm
          methods={methods}
          onSubmit={onSubmit}
          isEdit={false}
          onCancel={onCancel}
          submitLabel="Apply"
        >
          <RhfSelect name="type" label="Leave type" options={offered} helperText={typeHint} />
          <RhfDatePicker
            name="fromDate"
            label="From date"
            helperText="The first day you are away."
          />
          <RhfDatePicker
            name="toDate"
            label="To date"
            minDate={fromDate || undefined}
            helperText={
              fromDate
                ? 'The last day you are away — on or after the from date.'
                : 'Pick the from date first.'
            }
          />
          {days > 0 && (
            <Text size="sm" color="text.secondary" role="status">
              {t('{days} calendar days, both dates included.', { days })}
            </Text>
          )}
          <RhfTextField
            name="reason"
            label="Reason"
            multiline
            minRows={2}
            helperText="A line for your manager, e.g. “Family function in Pune”."
          />
        </EntityForm>
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <LeaveBalanceAside type={type} days={days} nameOf={(code) => names.get(code) ?? code} />
      </Grid>
    </Grid>
  );
}
