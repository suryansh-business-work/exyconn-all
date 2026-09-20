import { useT } from '@exyconn/i18n';
import { Alert, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useSignContractMutation } from '@exyconn/shell/graphql/generated';
import type { SignContractTarget } from './sign-contract.types';

interface SignContractFormProps {
  contract: SignContractTarget;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Signs our own side of a contract.
 *
 * There is nothing to fill in, and that is the change: this used to ask for a name and write
 * whatever was typed, so the signature said whoever the person at the keyboard wanted it to
 * say. The signer is now the account making the request, recorded with the time, the address
 * it came from and the hash of the document as it stood.
 */
export function SignContractForm({ contract, onDone, onCancel }: Readonly<SignContractFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [sign, { loading }] = useSignContractMutation();

  const onSign = async () => {
    try {
      await sign({ variables: { id: contract.id } });
      notify('“{title}” signed', 'success', { title: contract.title });
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'Signing failed'), 'error');
    }
  };

  return (
    <Flex direction="column" spacing={1.5}>
      <Text size="sm" color="text.secondary">
        {t('Signing “{title}” with {party}, as yourself.', {
          title: contract.title,
          party: contract.party,
        })}
      </Text>
      {contract.documentUrl ? (
        <Alert severity="info">
          {t('The document will be read and hashed now, so the signature is of this version.')}
        </Alert>
      ) : (
        <Alert severity="warning">
          {t('Attach the document to this contract first — there is nothing to sign yet.')}
        </Alert>
      )}
      <Flex direction="row" spacing={1}>
        <Button variant="contained" onClick={onSign} disabled={loading || !contract.documentUrl}>
          {t('Sign')}
        </Button>
        <Button variant="text" onClick={onCancel}>
          {t('Cancel')}
        </Button>
      </Flex>
    </Flex>
  );
}
