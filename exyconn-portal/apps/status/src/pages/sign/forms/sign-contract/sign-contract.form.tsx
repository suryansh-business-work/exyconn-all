import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Alert, Text } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSwitch } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { RhfSignaturePad } from '@exyconn/shell/components/signature';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useSignContractWithTokenMutation } from '@exyconn/shell/graphql/generated';
import type { SignContractFormProps } from './sign-contract.types';

/**
 * Typing the name, signing and agreeing are separate answers on purpose.
 *
 * A name in a box is not consent to anything; the switch is the act. All are required, and
 * the switch is what the record means when it says somebody agreed.
 */
const schema = z.object({
  signedName: z
    .string()
    .trim()
    .min(2, 'Type your full name')
    .max(120, 'Keep your name under 120 characters'),
  signatureImage: z.string().min(1, 'Draw or type your signature'),
  agreed: z.boolean().refine((value) => value, 'Confirm that you agree to be bound by it'),
});
type Values = z.infer<typeof schema>;

/** The public signing form: read it, type your name, sign, agree. */
export function SignContractForm({
  token,
  contract,
  onSigned,
  onCancel,
}: Readonly<SignContractFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [sign] = useSignContractWithTokenMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { signedName: contract.signerName, signatureImage: '', agreed: false },
  });

  const onSubmit = async (values: Values) => {
    try {
      const { data } = await sign({
        variables: {
          token,
          signedName: values.signedName,
          signatureImage: values.signatureImage,
        },
      });
      onSigned(data?.signContractWithToken.documentSha256 ?? '');
    } catch (error) {
      notify(errorMessage(error, 'The signature could not be recorded'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Sign"
    >
      <Alert severity="info">
        {t('Read the document above before signing. Your signature is recorded with the time.')}
      </Alert>
      <RhfTextField
        name="signedName"
        label="Your full name"
        required
        helperText="Your legal name, as the record will show you signed."
      />
      <RhfSignaturePad
        name="signatureImage"
        label="Your signature"
        required
        helperText="Draw it with a mouse, finger or stylus, or switch to Type to use your name."
      />
      <RhfSwitch name="agreed" label={t('I have read this contract and agree to be bound by it')} />
      <Text size="caption" color="text.secondary">
        {t(
          'Signing records your name, your signature, the moment, the address you are signing from and a fingerprint of the document as it is now.',
        )}
      </Text>
    </EntityForm>
  );
}
