import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useT } from '@exyconn/i18n';
import { Button, Flex } from '@exyconn/shell/components/ui';
import { RhfChipsInput, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  CrmEmailThreadsDocument,
  CrmTimelineDocument,
  CrmTimelineObject,
  useDraftCrmEmailMutation,
  useSendCrmEmailMutation,
} from '@exyconn/shell/graphql/generated';
import {
  composeEmailSchema,
  type ComposeEmailContext,
  type ComposeEmailValues,
} from './compose-email.types';

interface ComposeEmailFormProps {
  context: ComposeEmailContext;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form to email a contact, or reply in a thread, through the CRM's Gmail.
 * "Draft with AI" writes the message from the record, the thread and a short instruction.
 */
export function ComposeEmailForm({ context, onDone, onCancel }: Readonly<ComposeEmailFormProps>) {
  const t = useT();
  const notify = useNotify();
  const refetchQueries = [CrmEmailThreadsDocument, CrmTimelineDocument];
  const [send] = useSendCrmEmailMutation({ refetchQueries });
  const [draft, { loading: drafting }] = useDraftCrmEmailMutation();
  const methods = useForm<ComposeEmailValues>({
    mode: 'onTouched',
    resolver: zodResolver(composeEmailSchema),
    defaultValues: {
      to: context.to,
      cc: [],
      subject: context.subject ?? '',
      body: '',
      instruction: '',
    },
  });

  const onDraft = async () => {
    try {
      const { data } = await draft({
        variables: {
          input: {
            object:
              context.object === 'CONTACT' ? CrmTimelineObject.Contact : CrmTimelineObject.Company,
            id: context.id,
            threadId: context.threadId,
            instruction: methods.getValues('instruction'),
          },
        },
      });
      methods.setValue('body', data?.draftCrmEmail ?? '', {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (error) {
      portalLogger.warn('crm: drafting an email with AI failed', error);
      notify(errorMessage(error, 'The AI could not draft the email'), 'error');
    }
  };

  const onSubmit = async (values: ComposeEmailValues) => {
    try {
      await send({
        variables: {
          input: {
            to: values.to,
            cc: values.cc,
            subject: values.subject,
            body: values.body,
            threadId: context.threadId,
            inReplyTo: context.inReplyTo,
          },
        },
      });
      notify('Email sent', 'success');
      onDone();
    } catch (error) {
      portalLogger.warn('crm: sending an email failed', error);
      notify(errorMessage(error, 'The email could not be sent'), 'error');
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
      <RhfChipsInput name="to" label="To" helperText="Type an address and press Enter" />
      <RhfChipsInput name="cc" label="Cc" />
      <RhfTextField name="subject" label="Subject" />
      <Flex direction="column" spacing={1}>
        <RhfTextField
          name="instruction"
          label="Ask the AI to write it"
          helperText="e.g. thank them for the call and propose a demo next week"
        />
        <Button
          size="small"
          variant="outlined"
          startIcon={<AutoAwesomeIcon />}
          onClick={() =>
            onDraft().catch((error: unknown) => portalLogger.warn('crm: AI draft failed', error))
          }
          loading={drafting}
          sx={{ alignSelf: 'flex-start' }}
        >
          {t('Draft with AI')}
        </Button>
      </Flex>
      <RhfTextField name="body" label="Message" multiline minRows={8} />
    </EntityForm>
  );
}
