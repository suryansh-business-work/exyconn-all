import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useT } from '@exyconn/i18n';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  CrmTimelineDocument,
  CrmTimelineObject,
  useSendCrmSmsMutation,
} from '@exyconn/shell/graphql/generated';
import { readMemory, type CommsPanel } from '../../commsStore';
import { useFormMemory } from '../../useFormMemory';
import { recipientOptions } from '../recipient';
import { MAX_SMS_LENGTH, sendSmsSchema, type SendSmsValues } from './send-sms.types';

const DRAFT = 'sms-draft';

interface SendSmsFormProps {
  panel: CommsPanel;
  onCancel: () => void;
}

/** React Hook Form + Zod form to text one of the record's numbers through the company's SMS account. */
export function SendSmsForm({ panel, onCancel }: Readonly<SendSmsFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [send] = useSendCrmSmsMutation({ refetchQueries: [CrmTimelineDocument] });
  const options = recipientOptions(panel.phones);
  const empty: SendSmsValues = { to: options[0]?.value ?? '', body: '' };
  const methods = useForm<SendSmsValues>({
    mode: 'onTouched',
    resolver: zodResolver(sendSmsSchema),
    defaultValues: readMemory<SendSmsValues>(panel.key, DRAFT) ?? empty,
  });
  useFormMemory(methods, panel.key, DRAFT);
  const body = useWatch({ control: methods.control, name: 'body' });

  const onSubmit = async (values: SendSmsValues) => {
    try {
      await send({
        variables: {
          input: {
            object:
              panel.object === 'CONTACT' ? CrmTimelineObject.Contact : CrmTimelineObject.Company,
            id: panel.id,
            to: values.to,
            body: values.body,
          },
        },
      });
      notify('SMS sent to {name}', 'success', { name: panel.name });
      methods.reset({ to: values.to, body: '' });
    } catch (error) {
      portalLogger.warn('crm: sending an SMS failed', error);
      notify(errorMessage(error, 'The SMS could not be sent'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      submitLabel="Send"
      onCancel={onCancel}
    >
      <RhfSelect
        name="to"
        label="To"
        options={options}
        helperText="One of the record's phone numbers."
      />
      <RhfTextField
        name="body"
        label="Message"
        multiline
        minRows={4}
        slotProps={{ htmlInput: { maxLength: MAX_SMS_LENGTH } }}
        // A node, not a string: the field would otherwise translate each count as a new phrase.
        helperText={
          <>{t('{count} of {max} characters', { count: body.length, max: MAX_SMS_LENGTH })}</>
        }
      />
    </EntityForm>
  );
}
