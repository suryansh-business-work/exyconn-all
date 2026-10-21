import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useT } from '@exyconn/i18n';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useUpdateColdEmailVariantMutation,
  type ColdEmailVariantFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { editVariantSchema, type EditVariantValues } from './edit-variant.types';

interface EditVariantFormProps {
  draftId: string;
  variant: ColdEmailVariantFieldsFragment;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to edit one unsent version's subject and message. */
export function EditVariantForm({
  draftId,
  variant,
  onDone,
  onCancel,
}: Readonly<EditVariantFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [update] = useUpdateColdEmailVariantMutation();
  const methods = useForm<EditVariantValues>({
    mode: 'onTouched',
    resolver: zodResolver(editVariantSchema),
    defaultValues: { subject: variant.subject, body: variant.body },
  });

  const onSubmit = async (values: EditVariantValues) => {
    try {
      await update({ variables: { draftId, variantId: variant.id, ...values } });
      notify(t('Version saved'), 'success');
      onDone();
    } catch (error) {
      portalLogger.warn('crm: saving a cold email version failed', error);
      notify(errorMessage(error, t('Could not save the version.')), 'error');
    }
  };

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit onCancel={onCancel}>
      <RhfTextField name="subject" label="Subject" />
      <RhfTextField
        name="body"
        label="Message"
        multiline
        minRows={10}
        helperText="Plain text; leave a blank line between paragraphs"
      />
    </EntityForm>
  );
}
