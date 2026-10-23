import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useT } from '@exyconn/i18n';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Button, Flex, Link } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
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
import { ComposeAddressFields } from './compose-email.fields';
import { useComposeSender } from './useComposeSender';
import { readMemory, useFormMemory } from '@exyconn/shell/components/compose-dock';
import { EMAIL_INTEGRATIONS_PATH } from '../../../../integrations/emailIntegrationsPath';

const DRAFT = 'email-draft';

interface ComposeEmailFormProps {
  context: ComposeEmailContext;
  /** In the communication dock: keeps the draft while the page remounts on navigation. */
  memoryKey?: string;
  /** Sends instead of the plain CRM send, e.g. a cold email version that must be tracked. */
  send?: (values: ComposeEmailValues) => Promise<void>;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form to email a contact, or reply in a thread, from one of the CRM's
 * connected Gmail or Microsoft mailboxes. "Draft with AI" writes the message from the record,
 * the thread and a short instruction.
 */
export function ComposeEmailForm({
  context,
  memoryKey,
  send: sendOverride,
  onDone,
  onCancel,
}: Readonly<ComposeEmailFormProps>) {
  const t = useT();
  const notify = useNotify();
  const navigate = useNavigate();
  const refetchQueries = [CrmEmailThreadsDocument, CrmTimelineDocument];
  const [send] = useSendCrmEmailMutation({ refetchQueries });
  const [draft, { loading: drafting }] = useDraftCrmEmailMutation();
  const remembered = memoryKey ? readMemory<ComposeEmailValues>(memoryKey, DRAFT) : undefined;
  const methods = useForm<ComposeEmailValues>({
    mode: 'onTouched',
    resolver: zodResolver(composeEmailSchema),
    defaultValues: remembered ?? {
      fromAccountId: '',
      to: context.to,
      cc: [],
      subject: context.subject ?? '',
      body: context.body ?? '',
      instruction: '',
    },
  });

  useFormMemory(methods, memoryKey, DRAFT);
  const sender = useComposeSender(context);
  useEffect(() => {
    if (sender.preferred && methods.getValues('fromAccountId') === '') {
      methods.setValue('fromAccountId', sender.preferred);
    }
  }, [sender.preferred, methods]);

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

  const sendPlain = async (values: ComposeEmailValues) => {
    await send({
      variables: {
        input: {
          fromAccountId: values.fromAccountId,
          to: values.to,
          cc: values.cc,
          subject: values.subject,
          body: values.body,
          threadId: context.threadId,
          inReplyTo: context.inReplyTo,
        },
      },
    });
  };

  const onSubmit = async (values: ComposeEmailValues) => {
    try {
      await (sendOverride ?? sendPlain)(values);
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
      {!sender.loading && sender.options.length === 0 && (
        <Alert
          severity="warning"
          action={
            <Link component={RouterLink} to={EMAIL_INTEGRATIONS_PATH} color="inherit">
              {t('Connect a mailbox')}
            </Link>
          }
        >
          {t(
            'No mailbox is turned on for the CRM. Connect a Gmail or Microsoft account in CRM > Integrations > Email.',
          )}
        </Alert>
      )}
      <RhfSelect
        name="fromAccountId"
        label="From"
        options={sender.options}
        helperText="The connected Gmail or Microsoft mailbox it is sent from"
        action={{
          label: 'Add email',
          icon: <AddIcon fontSize="small" />,
          onSelect: () => navigate(EMAIL_INTEGRATIONS_PATH),
        }}
      />
      <ComposeAddressFields to={context.to} recipientsLocked={context.recipientsLocked} />
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
      <RhfTextField
        name="body"
        label="Message"
        multiline
        minRows={8}
        helperText="Sent as written. Draft with AI fills this in, and you can edit it before sending."
      />
    </EntityForm>
  );
}
