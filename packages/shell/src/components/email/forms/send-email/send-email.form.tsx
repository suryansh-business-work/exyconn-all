import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { zodResolver } from '@/components/form/zodResolver';
import { EntityForm } from '@/components/form/EntityForm';
import { RhfChipsInput, RhfRichText, RhfSelect, RhfTextField } from '@/components/form/rhf';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { PROVIDER_NAMES } from '@/components/mailboxes';
import { readMemory, useFormMemory } from '@/components/compose-dock';
import { useSendMyEmailMutation } from '@/graphql/generated';
import { portalLogger } from '@/logging/portalLogger';
import { errorMessage } from '@/utils/errorMessage';
import {
  sendEmailSchema,
  type EmailDraft,
  type MyMailbox,
  type SendEmailValues,
} from './send-email.types';

const DRAFT = 'email-draft';
/** Where a person connects another mailbox of their own. */
const SETTINGS_PATH = '/settings';

interface SendEmailFormProps {
  draft: EmailDraft;
  /** The person's mailboxes that can send now, the default one first. */
  mailboxes: readonly MyMailbox[];
  /** In the dock: keeps the draft while the page remounts on navigation. */
  memoryKey?: string;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form to write an email and send it from one of the person's own
 * Gmail or Microsoft mailboxes. Nothing is kept on a CRM record.
 */
export function SendEmailForm({
  draft,
  mailboxes,
  memoryKey,
  onDone,
  onCancel,
}: Readonly<SendEmailFormProps>) {
  const notify = useNotify();
  const navigate = useNavigate();
  const [send] = useSendMyEmailMutation();
  const remembered = memoryKey ? readMemory<SendEmailValues>(memoryKey, DRAFT) : undefined;
  const methods = useForm<SendEmailValues>({
    mode: 'onTouched',
    resolver: zodResolver(sendEmailSchema),
    defaultValues: remembered ?? {
      fromMailboxId: mailboxes[0]?.id ?? '',
      to: draft.to,
      cc: draft.cc ?? [],
      bcc: draft.bcc ?? [],
      subject: draft.subject ?? '',
      body: draft.body ?? '',
    },
  });
  useFormMemory(methods, memoryKey, DRAFT);

  const options = mailboxes.map((mailbox) => ({
    value: mailbox.id,
    label: `${mailbox.email} (${PROVIDER_NAMES[mailbox.provider]})`,
  }));

  const onSubmit = async (values: SendEmailValues) => {
    try {
      await send({ variables: { input: values } });
      notify('Email sent', 'success');
      onDone();
    } catch (error) {
      portalLogger.warn('email: sending an email failed', error);
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
      <RhfSelect
        name="fromMailboxId"
        label="From"
        options={options}
        helperText="Your own mailbox it is sent from"
        action={{
          label: 'Add email',
          icon: <AddIcon fontSize="small" />,
          onSelect: () => navigate(SETTINGS_PATH),
        }}
      />
      <RhfChipsInput name="to" label="To" helperText="Type an address and press Enter" />
      <RhfChipsInput name="cc" label="Cc" helperText="Optional. Others who get a copy." />
      <RhfChipsInput
        name="bcc"
        label="Bcc"
        helperText="Optional. Others who get a copy without the rest seeing them."
      />
      <RhfTextField
        name="subject"
        label="Subject"
        helperText="What they see in their inbox, up to 200 characters."
      />
      <RhfRichText name="body" label="Message" folder="email" minHeight={200} />
    </EntityForm>
  );
}
