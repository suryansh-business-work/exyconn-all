import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { Button, Flex, Text } from '@/components/ui';
import { RhfChipsInput, RhfRichText, RhfTextField } from '@/components/form/rhf';
import { EntityForm } from '@/components/form/EntityForm';
import { RhfAttachmentPicker } from '@/components/upload';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { errorMessage } from '@/utils/errorMessage';
import { useSendUserMailMutation } from '@/graphql/generated';
import { customMailSchema, EMPTY_MAIL, type CustomMailValues } from './custom-mail.schema';

/** Where the email's attachments land on the CDN. */
const MAIL_UPLOAD_FOLDER = 'user-mail';

interface CustomMailFormProps {
  userId: string;
  /** Who the email goes to, shown on the To line. */
  recipient: { name: string; email: string };
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form to email one person: a rich-text message, CC and BCC (shown on
 * demand, as in a mail client) and attached files. Sent from the workspace's own address.
 */
export function CustomMailForm({
  userId,
  recipient,
  onDone,
  onCancel,
}: Readonly<CustomMailFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [sendUserMail] = useSendUserMailMutation();
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const methods = useForm<CustomMailValues>({
    mode: 'onTouched',
    resolver: zodResolver(customMailSchema),
    defaultValues: EMPTY_MAIL,
  });

  const onSubmit = async (values: CustomMailValues) => {
    try {
      await sendUserMail({ variables: { id: userId, input: values } });
      notify('Email sent');
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'Failed to send email'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Send"
    >
      <Flex direction="row" alignItems="center" gap={1} flexWrap="wrap" useFlexGap>
        <Text size="sm" color="text.secondary">
          {t('To')}
        </Text>
        <Text size="sm" weight="medium" sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
          {t('{name} <{email}>', recipient)}
        </Text>
        {!showCc && (
          <Button size="small" variant="text" onClick={() => setShowCc(true)}>
            {t('Cc')}
          </Button>
        )}
        {!showBcc && (
          <Button size="small" variant="text" onClick={() => setShowBcc(true)}>
            {t('Bcc')}
          </Button>
        )}
      </Flex>
      {showCc && (
        <RhfChipsInput
          name="cc"
          label="Cc"
          helperText="Type an address and press Enter. Everyone sees these."
        />
      )}
      {showBcc && (
        <RhfChipsInput
          name="bcc"
          label="Bcc"
          helperText="Type an address and press Enter. Hidden from the others."
        />
      )}
      <RhfTextField
        name="subject"
        label="Subject"
        required
        helperText="What the email is about, in a few words."
      />
      <RhfRichText
        name="message"
        label="Message"
        required
        folder={MAIL_UPLOAD_FOLDER}
        minHeight={180}
        helperText="Formatting, links, lists and images are kept in the email."
      />
      <RhfAttachmentPicker name="attachments" folder={MAIL_UPLOAD_FOLDER} />
    </EntityForm>
  );
}
