import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { ItDecision } from '@exyconn/shell/graphql/generated';
import type { DecideHandler, DecisionValues } from './decision.types';

const DECISION_OPTIONS = enumOptions(Object.values(ItDecision));
const NOTE_MAX = 500;

export const decisionSchema = z
  .object({
    decision: z.nativeEnum(ItDecision),
    note: z.string().trim().max(NOTE_MAX, `Keep the note under ${NOTE_MAX} characters`),
  })
  // A rejection with no reason leaves the requester guessing, so it has to say why.
  .refine((v) => v.decision !== ItDecision.Rejected || v.note.length > 0, {
    message: 'Say why it is being rejected',
    path: ['note'],
  });

interface DecisionFormProps {
  onDecide: DecideHandler;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to approve or reject an access request, change or purchase. */
export function DecisionForm({ onDecide, onDone, onCancel }: Readonly<DecisionFormProps>) {
  const notify = useNotify();
  const methods = useForm<DecisionValues>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { decision: ItDecision.Approved, note: '' },
  });

  const onSubmit = async (values: DecisionValues) => {
    try {
      await onDecide(values);
      notify(values.decision === ItDecision.Approved ? 'Approved' : 'Rejected');
      onDone();
    } catch (error) {
      notify(errorMessage(error, 'Could not record the decision'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Record decision"
    >
      <RhfSelect name="decision" label="Decision" options={DECISION_OPTIONS} />
      <RhfTextField
        name="note"
        label="Note"
        helperText="Sent to the requester. Required when rejecting."
        multiline
        rows={3}
      />
    </EntityForm>
  );
}
