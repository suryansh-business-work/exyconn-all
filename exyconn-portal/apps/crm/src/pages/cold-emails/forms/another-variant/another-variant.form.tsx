import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  ColdEmailDraftsDocument,
  useAddColdEmailVariantMutation,
  type ColdEmailTone,
} from '@exyconn/shell/graphql/generated';
import { useToneOptions } from '../../../../records/cold-email';
import { anotherVariantSchema, type AnotherVariantValues } from './another-variant.types';

interface AnotherVariantFormProps {
  draftId: string;
  /** The draft's tone, which the new version starts from. */
  tone: ColdEmailTone;
}

/**
 * React Hook Form + Zod form that asks the AI for one more version of the draft, optionally
 * with a tweak ("shorter", "mention the free pilot") or in another tone.
 */
export function AnotherVariantForm({ draftId, tone }: Readonly<AnotherVariantFormProps>) {
  const t = useT();
  const notify = useNotify();
  const toneOptions = useToneOptions();
  const [addVariant] = useAddColdEmailVariantMutation({
    refetchQueries: [ColdEmailDraftsDocument],
  });
  const methods = useForm<AnotherVariantValues>({
    mode: 'onTouched',
    resolver: zodResolver(anotherVariantSchema),
    defaultValues: { instruction: '', tone },
  });

  const onSubmit = async (values: AnotherVariantValues) => {
    try {
      await addVariant({
        variables: { id: draftId, instruction: values.instruction, tone: values.tone },
      });
      notify(t('New version written'), 'success');
      methods.reset({ instruction: '', tone: values.tone });
    } catch (error) {
      portalLogger.warn('crm: writing another cold email version failed', error);
      notify(errorMessage(error, t('The AI could not write another version.')), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      submitLabel="Generate another version"
      onCancel={() => methods.reset({ instruction: '', tone })}
    >
      <RhfTextField
        name="instruction"
        label="What should change (optional)"
        helperText="e.g. shorter, mention our free pilot, ask for a 15-minute call"
      />
      <RhfSelect name="tone" label="Tone" options={toneOptions} />
      <Text component="p" size="caption" color="text.secondary">
        {t('Each version is written by the AI and spends AI budget.')}
      </Text>
    </EntityForm>
  );
}
