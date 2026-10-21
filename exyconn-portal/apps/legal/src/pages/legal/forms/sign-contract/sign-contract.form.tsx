import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { RhfSignaturePad } from '@exyconn/shell/components/signature';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useSignContractMutation } from '@exyconn/shell/graphql/generated';
import type { SignContractTarget } from './sign-contract.types';

const schema = z.object({
  signatureImage: z.string().min(1, 'Draw or type your signature'),
});
type Values = z.infer<typeof schema>;

interface SignContractFormProps {
  contract: SignContractTarget;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Signs our own side of a contract.
 *
 * The signer is the account making the request — never a name typed into a field — recorded
 * with their drawn signature, the time, the address it came from and the hash of the
 * document as it stood.
 */
export function SignContractForm({ contract, onDone, onCancel }: Readonly<SignContractFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [sign] = useSignContractMutation();
  const methods = useForm<Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { signatureImage: '' },
  });
  const hasDocument = Boolean(contract.documentUrl);

  const onSubmit = async (values: Values) => {
    try {
      await sign({ variables: { id: contract.id, signatureImage: values.signatureImage } });
      notify('“{title}” signed', 'success', { title: contract.title });
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'Signing failed'), 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={methods.handleSubmit(onSubmit)}>
        <Flex direction="column" spacing={1.5}>
          <Text size="sm" color="text.secondary">
            {t('Signing “{title}” with {party}, as yourself.', {
              title: contract.title,
              party: contract.party,
            })}
          </Text>
          {hasDocument ? (
            <Alert severity="info">
              {t('The document will be read and hashed now, so the signature is of this version.')}
            </Alert>
          ) : (
            <Alert severity="warning">
              {t('Attach the document to this contract first — there is nothing to sign yet.')}
            </Alert>
          )}
          <RhfSignaturePad
            name="signatureImage"
            label="Your signature"
            required
            helperText="Draw it with a mouse, finger or stylus, or switch to Type to use your name."
          />
          <Flex direction="row" spacing={1}>
            <Button
              type="submit"
              variant="contained"
              loading={methods.formState.isSubmitting}
              disabled={!hasDocument}
            >
              {t('Sign')}
            </Button>
            <Button variant="text" onClick={onCancel}>
              {t('Cancel')}
            </Button>
          </Flex>
        </Flex>
      </form>
    </FormProvider>
  );
}
