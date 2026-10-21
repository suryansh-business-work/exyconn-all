import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import type { z } from 'zod';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { RhfSelect, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import {
  useCreateCallingBotScenarioMutation,
  useUpdateCallingBotScenarioMutation,
} from '@exyconn/shell/graphql/generated';
import {
  callingBotScenarioSchema,
  SCENARIO_LANGUAGE_OPTIONS,
  SETTINGS_LANGUAGE,
  type CallingBotScenarioRow,
  type CallingBotScenarioSchema,
  type CallingBotScenarioValues,
} from './calling-bot-scenario.types';

const toInitial = (
  row: CallingBotScenarioRow | null,
  nextOrder: number,
): z.input<CallingBotScenarioSchema> => ({
  title: row?.title ?? '',
  description: row?.description ?? '',
  systemPrompt: row?.systemPrompt ?? '',
  greeting: row?.greeting ?? '',
  languageCode: row?.languageCode || SETTINGS_LANGUAGE,
  enabled: row?.enabled ?? true,
  order: row?.order ?? nextOrder,
});

const toInput = (values: CallingBotScenarioValues) => ({
  ...values,
  languageCode: values.languageCode === SETTINGS_LANGUAGE ? '' : values.languageCode,
});

interface CallingBotScenarioFormProps {
  initial: CallingBotScenarioRow | null;
  /** Where a new example goes: after the last one. */
  nextOrder: number;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for one example call the bot can play. */
export function CallingBotScenarioForm({
  initial,
  nextOrder,
  onDone,
  onCancel,
}: Readonly<CallingBotScenarioFormProps>) {
  const [createScenario] = useCreateCallingBotScenarioMutation();
  const [updateScenario] = useUpdateCallingBotScenarioMutation();
  const methods = useForm<z.input<CallingBotScenarioSchema>, unknown, CallingBotScenarioValues>({
    mode: 'onTouched',
    resolver: zodResolver(callingBotScenarioSchema),
    defaultValues: toInitial(initial, nextOrder),
  });
  const { isEdit, onSubmit } = useEntitySave({
    label: 'Calling bot example',
    initial,
    create: (values: CallingBotScenarioValues) =>
      createScenario({ variables: { input: toInput(values) } }),
    update: (row, values) => updateScenario({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });
  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField
        name="title"
        label="Title"
        helperText="What the visitor picks, e.g. Hotel booking."
      />
      <RhfTextField
        name="description"
        label="Description"
        helperText="One line on the demo: who the bot is and what to try."
      />
      <RhfTextField
        name="systemPrompt"
        label="Who the bot is"
        multiline
        minRows={5}
        helperText="The bot's role on this call, what it knows and what it should get from the caller. Replaces the settings' prompt."
      />
      <RhfTextField
        name="greeting"
        label="Opening line"
        helperText="The first thing the bot says when the call connects."
      />
      <RhfSelect
        name="languageCode"
        label="Language"
        options={SCENARIO_LANGUAGE_OPTIONS}
        helperText="The language the bot speaks and listens in on this example."
      />
      <RhfTextField
        name="order"
        label="Order"
        type="number"
        helperText="Smaller numbers are listed first on the demo."
      />
      <RhfSwitch name="enabled" label="Offered on the demo" />
    </EntityForm>
  );
}
