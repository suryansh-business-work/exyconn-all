import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  WhatsappChannelDocument,
  useSaveWhatsappChannelMutation,
} from '@exyconn/shell/graphql/generated';
import {
  makeWhatsappNumberSchema,
  toWhatsappNumberValues,
  type WhatsappChannelRow,
  type WhatsappNumberFormValues,
} from './whatsapp-number.types';

interface WhatsappNumberFormProps {
  initial: WhatsappChannelRow | null;
}

const KEEP_SECRET_HINT = 'Leave blank to keep the current value';

/**
 * React Hook Form + Zod form for the company's real WhatsApp Business number (Meta WhatsApp
 * Cloud API). Saving refetches the settings, so the screen shows what the server stored.
 */
export function WhatsappNumberForm({ initial }: Readonly<WhatsappNumberFormProps>) {
  const notify = useNotify();
  const isEdit = initial !== null;
  const [save] = useSaveWhatsappChannelMutation({ refetchQueries: [WhatsappChannelDocument] });
  const methods = useForm<WhatsappNumberFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(makeWhatsappNumberSchema(isEdit)),
    defaultValues: toWhatsappNumberValues(initial),
  });

  const onSubmit = async (values: WhatsappNumberFormValues) => {
    try {
      await save({ variables: { input: values } });
      methods.reset({ ...values, accessToken: '', appSecret: '' });
      notify(isEdit ? 'WhatsApp number updated' : 'WhatsApp number connected', 'success');
    } catch (error) {
      portalLogger.warn('wa-demo: saving the WhatsApp number failed', error);
      notify(errorMessage(error, 'Could not save the WhatsApp number'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={isEdit}
      submitLabel={isEdit ? 'Save changes' : 'Connect number'}
      onCancel={() => methods.reset(toWhatsappNumberValues(initial))}
    >
      <RhfTextField
        name="phoneNumberId"
        label="Phone number ID"
        helperText="Meta app > WhatsApp > API Setup, under the number messages are sent from"
      />
      <RhfTextField
        name="displayPhone"
        label="Phone number"
        helperText="The number as people dial it, e.g. +1 555 010 0000. Shown here only."
      />
      <RhfTextField
        name="accessToken"
        label="Access token"
        type="password"
        helperText={
          isEdit
            ? KEEP_SECRET_HINT
            : 'A permanent System User token with whatsapp_business_messaging. The temporary token expires in a day.'
        }
      />
      <RhfTextField
        name="appSecret"
        label="App secret"
        type="password"
        helperText={
          isEdit
            ? KEEP_SECRET_HINT
            : 'Meta app > App settings > Basic. Checks every delivery came from Meta.'
        }
      />
      <RhfTextField
        name="verifyToken"
        label="Verify token"
        helperText="Paste this into Meta's webhook settings as the Verify token"
      />
      <RhfSwitch name="enabled" label="Answer messages on this number" />
    </EntityForm>
  );
}
