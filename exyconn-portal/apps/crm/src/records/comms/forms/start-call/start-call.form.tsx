import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  CrmTimelineDocument,
  CrmTimelineObject,
  useStartCrmCallMutation,
} from '@exyconn/shell/graphql/generated';
import { readMemory, type CommsPanel } from '../../commsStore';
import { useFormMemory } from '../../useFormMemory';
import { readAgentPhone, saveAgentPhone } from '../../agentPhone';
import { recipientOptions } from '../recipient';
import { startCallSchema, type StartCallValues } from './start-call.types';

const DRAFT = 'call-draft';

interface StartCallFormProps {
  panel: CommsPanel;
  /** The provider queued the call: the agent's phone is ringing. */
  onStarted: () => void;
  /** The call could not be placed; the reason is shown in the panel. */
  onFailed: (message: string) => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for click-to-call: the provider rings the agent's own phone first,
 * then connects it to the chosen number on the record.
 */
export function StartCallForm({
  panel,
  onStarted,
  onFailed,
  onCancel,
}: Readonly<StartCallFormProps>) {
  const [startCall] = useStartCrmCallMutation({ refetchQueries: [CrmTimelineDocument] });
  const options = recipientOptions(panel.phones);
  const methods = useForm<StartCallValues>({
    mode: 'onTouched',
    resolver: zodResolver(startCallSchema),
    defaultValues: readMemory<StartCallValues>(panel.key, DRAFT) ?? {
      to: options[0]?.value ?? '',
      agentPhone: readAgentPhone(),
    },
  });
  useFormMemory(methods, panel.key, DRAFT);

  const onSubmit = async (values: StartCallValues) => {
    try {
      await startCall({
        variables: {
          input: {
            object:
              panel.object === 'CONTACT' ? CrmTimelineObject.Contact : CrmTimelineObject.Company,
            id: panel.id,
            to: values.to,
            agentPhone: values.agentPhone,
          },
        },
      });
      saveAgentPhone(values.agentPhone);
      onStarted();
    } catch (error) {
      portalLogger.warn('crm: starting a call failed', error);
      onFailed(errorMessage(error, 'The call could not be placed'));
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      submitLabel="Call"
      onCancel={onCancel}
    >
      <RhfSelect name="to" label="Number to call" options={options} />
      <RhfTextField
        name="agentPhone"
        label="Your phone"
        inputMode="tel"
        autoComplete="tel"
        helperText="Rings first; answer it and the call connects. Remembered on this browser."
      />
    </EntityForm>
  );
}
