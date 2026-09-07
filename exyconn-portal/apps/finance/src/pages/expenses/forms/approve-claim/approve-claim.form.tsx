import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { formatMoney } from '@exyconn/shell/utils/money';
import { ExpenseStatus, useSetExpenseClaimStatusMutation } from '@exyconn/shell/graphql/generated';
import type { ApproveClaimTarget } from './approve-claim.types';

/** The schema depends on the claim: finance may clear less than was asked, never more. */
const schemaFor = (claimed: number) =>
  z.object({
    approvedAmount: z.coerce
      .number({ message: 'Amount must be a number' })
      .min(0, 'Must be ≥ 0')
      .max(claimed, `Cannot exceed the ${claimed} claimed`),
  });
type Schema = ReturnType<typeof schemaFor>;
type Values = z.infer<Schema>;

interface ApproveClaimFormProps {
  claim: ApproveClaimTarget;
  onDone: () => void;
  onCancel: () => void;
}

/** Approves a claim for an amount — the claim in full by default. */
export function ApproveClaimForm({ claim, onDone, onCancel }: Readonly<ApproveClaimFormProps>) {
  const notify = useNotify();
  const [setStatus] = useSetExpenseClaimStatusMutation();
  const methods = useForm<z.input<Schema>, unknown, Values>({
    resolver: zodResolver(schemaFor(claim.amount)),
    defaultValues: { approvedAmount: claim.approvedAmount ?? claim.amount },
  });

  const onSubmit = async (values: Values) => {
    try {
      await setStatus({
        variables: {
          id: claim.id,
          status: ExpenseStatus.Approved,
          approvedAmount: values.approvedAmount,
        },
      });
      notify(`Claim approved for ${formatMoney(values.approvedAmount, claim.currency)}`);
      onDone();
    } catch (error) {
      notify(errorMessage(error, 'Could not approve the claim'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Approve"
    >
      <Text size="sm" color="text.secondary">
        {claim.description} — {formatMoney(claim.amount, claim.currency)} claimed.
      </Text>
      <RhfTextField
        name="approvedAmount"
        label="Approved amount"
        type="number"
        helperText="Defaults to the amount claimed"
      />
    </EntityForm>
  );
}
