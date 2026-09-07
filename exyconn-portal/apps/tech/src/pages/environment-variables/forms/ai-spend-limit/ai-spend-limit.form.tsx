import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useSaveAiSpendLimitMutation } from '@exyconn/shell/graphql/generated';
import type { AiSpendLimit } from './ai-spend-limit.types';

/** A cap above this is not a budget, so it is far more likely to be a typo. */
const MAX_CAP = 100_000;

const cap = (label: string) =>
  z.coerce
    .number({ message: `${label} must be a number` })
    .min(0, `${label} cannot be negative`)
    .max(MAX_CAP, `${label} must be at most $${MAX_CAP.toLocaleString()}`);

const schema = z.object({
  monthlyUsdCap: cap('The monthly cap'),
  perUserDailyUsdCap: cap('The per-person daily cap'),
  enabled: z.boolean(),
});
type Values = z.infer<typeof schema>;

interface AiSpendLimitFormProps {
  initial: AiSpendLimit;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * The ceiling every AI run is checked against before it goes out. Both caps are checked
 * independently, and a cap of zero switches that one off — so a workspace can hold a
 * monthly total without policing anybody's day, or the other way round.
 */
export function AiSpendLimitForm({ initial, onDone, onCancel }: Readonly<AiSpendLimitFormProps>) {
  const notify = useNotify();
  const [saveLimit] = useSaveAiSpendLimitMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    values: {
      monthlyUsdCap: String(initial.monthlyUsdCap),
      perUserDailyUsdCap: String(initial.perUserDailyUsdCap),
      enabled: initial.enabled,
    },
  });

  const onSubmit = async (values: Values) => {
    try {
      await saveLimit({ variables: { input: values } });
      notify('AI budget saved');
      onDone();
    } catch (error) {
      notify(errorMessage(error, 'Could not save the budget'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={onCancel}
      submitLabel="Save budget"
    >
      <Text size="sm" color="text.secondary">
        A run is refused before it is sent once a cap is reached, and the person who asked for it is
        told which cap and what has already gone on it. Leave a cap at 0 to switch it off.
      </Text>
      <RhfSwitch name="enabled" label="Enforce the AI budget" />
      <RhfTextField
        name="monthlyUsdCap"
        label="Whole workspace, this calendar month (USD)"
        helperText="Counts every finished run, whoever started it"
      />
      <RhfTextField
        name="perUserDailyUsdCap"
        label="Per person, today (USD)"
        helperText="Counts only that person's own finished runs"
      />
    </EntityForm>
  );
}
