import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useSaveAiModelPriceMutation } from '@exyconn/shell/graphql/generated';
import type { AiModelPriceRow } from './ai-model-price.types';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** A price above this per 1,000 tokens is a decimal-point slip, not a real list price. */
const MAX_PRICE = 10;

const price = (label: string) =>
  z.coerce
    .number({ message: `${label} must be a number` })
    .min(0, `${label} cannot be negative`)
    .max(MAX_PRICE, `${label} looks wrong — it is per 1,000 tokens, not per million`);

const schema = z.object({
  model: z.string().trim().min(1, 'Name the model this price is for'),
  inputPer1kUsd: price('The input price'),
  outputPer1kUsd: price('The output price'),
  active: z.enum(['true', 'false']),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: AiModelPriceRow | null): z.input<typeof schema> => ({
  model: row?.model ?? '',
  inputPer1kUsd: String(row?.inputPer1kUsd ?? 0),
  outputPer1kUsd: String(row?.outputPer1kUsd ?? 0),
  active: row?.active === false ? 'false' : 'true',
});

interface AiModelPriceFormProps {
  initial: AiModelPriceRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * What one model costs, per 1,000 tokens. Upserted on the model name, so the same form
 * both adds a model OpenAI has just published and corrects one whose price moved.
 */
export function AiModelPriceForm({ initial, onDone, onCancel }: Readonly<AiModelPriceFormProps>) {
  const notify = useNotify();
  const [savePrice] = useSaveAiModelPriceMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    try {
      await savePrice({
        variables: {
          input: {
            model: values.model,
            inputPer1kUsd: values.inputPer1kUsd,
            outputPer1kUsd: values.outputPer1kUsd,
            active: values.active === 'true',
          },
        },
      });
      notify(`Price for ${values.model} saved`);
      onDone();
    } catch (error) {
      notify(errorMessage(error, 'Could not save the price'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={Boolean(initial)}
      onCancel={onCancel}
      submitLabel="Save price"
    >
      <Text size="sm" color="text.secondary">
        Prices are US dollars per 1,000 tokens, exactly as OpenAI publishes them. A model with no
        active price here costs a run nothing — we never guess a rate.
      </Text>
      <RhfTextField
        name="model"
        label="Model"
        helperText="The model id, e.g. gpt-4o-mini"
        disabled={Boolean(initial)}
      />
      <RhfTextField name="inputPer1kUsd" label="Input price (USD / 1K tokens)" />
      <RhfTextField name="outputPer1kUsd" label="Output price (USD / 1K tokens)" />
      <RhfSelect name="active" label="Use this price" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
