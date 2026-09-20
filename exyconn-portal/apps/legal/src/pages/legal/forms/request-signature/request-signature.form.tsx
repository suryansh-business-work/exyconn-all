import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import { useT } from '@exyconn/i18n';
import { Alert, Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useRequestContractSignatureMutation } from '@exyconn/shell/graphql/generated';
import type { RequestSignatureTarget } from './request-signature.types';

const schema = z.object({
  signerName: z.string().trim().min(2, 'Who are you asking?'),
  signerEmail: z.string().trim().regex(EMAIL, 'Enter a valid email'),
  message: z.string().trim().max(1000, 'Keep the message under 1000 characters'),
});
type Values = z.infer<typeof schema>;

interface RequestSignatureFormProps {
  contract: RequestSignatureTarget;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Asks a counterparty to sign.
 *
 * This replaced "send the contract as an email": the counterparty now gets a link that
 * identifies them, reads the document behind it and signs there, and what comes back is
 * evidence — the name they typed, where they answered from and the hash of the file they
 * were shown. Typing a name into our own field recorded an assertion, not a signature.
 */
export function RequestSignatureForm({
  contract,
  onDone,
  onCancel,
}: Readonly<RequestSignatureFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [request] = useRequestContractSignatureMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { signerName: contract.party, signerEmail: '', message: '' },
  });

  const onSubmit = async (values: Values) => {
    try {
      await request({
        variables: {
          contractId: contract.id,
          signerName: values.signerName,
          signerEmail: values.signerEmail,
          message: values.message || null,
        },
      });
      notify('Signing link sent to {email}', 'success', { email: values.signerEmail });
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'The request could not be sent'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Send for signature"
    >
      <Text size="sm" color="text.secondary">
        {t('Asking for a signature on “{title}”.', { title: contract.title })}
      </Text>
      {!contract.documentUrl && (
        <Alert severity="warning">
          {t('Attach the document to this contract first — there is nothing to sign yet.')}
        </Alert>
      )}
      <RhfTextField name="signerName" label="Who is signing" />
      <RhfTextField
        name="signerEmail"
        label="Their email"
        helperText="The link is theirs alone and works for 30 days"
      />
      <RhfTextField name="message" label="Message (optional)" multiline minRows={3} />
    </EntityForm>
  );
}
