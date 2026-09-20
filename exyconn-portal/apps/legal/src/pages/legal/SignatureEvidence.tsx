import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Chip, Flex, LinearProgress, Text } from '@exyconn/shell/components/ui';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useContractSignaturesQuery,
  useRevokeContractSignatureMutation,
  type ContractSignaturesQuery,
} from '@exyconn/shell/graphql/generated';

type Signature = ContractSignaturesQuery['contractSignatures'][number];

interface SignatureEvidenceProps {
  contractId: string;
}

/** What state a request is in, in one word. */
function stateOf(signature: Signature): { label: string; colour: 'success' | 'default' | 'info' } {
  if (signature.signedAt) {
    return { label: 'Signed', colour: 'success' };
  }
  if (signature.revokedAt) {
    return { label: 'Withdrawn', colour: 'default' };
  }
  return { label: 'Waiting', colour: 'info' };
}

interface SignatureRowProps {
  signature: Signature;
  formatDateTime: (value: string | null | undefined) => string;
  onWithdraw: (signature: Signature) => void;
}

function SignatureRow({ signature, formatDateTime, onWithdraw }: Readonly<SignatureRowProps>) {
  const t = useT();
  const state = stateOf(signature);
  return (
    <Box sx={{ py: 1, borderTop: 1, borderColor: 'divider' }}>
      <Flex
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Flex direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Text size="sm">{signature.signerName}</Text>
          <Chip size="small" label={t(state.label)} color={state.colour} variant="outlined" />
        </Flex>
        {!signature.signedAt && !signature.revokedAt && (
          <Button size="small" variant="outlined" onClick={() => onWithdraw(signature)}>
            {t('Withdraw')}
          </Button>
        )}
      </Flex>
      <Text size="caption" color="text.secondary">
        {signature.signerEmail}
      </Text>
      {signature.signedAt ? (
        <Box>
          <Text size="caption" color="text.secondary">
            {t('Signed as “{name}” on {when}, from {ip}', {
              name: signature.signedName,
              when: formatDateTime(signature.signedAt),
              ip: signature.signedIp || t('an unknown address'),
            })}
          </Text>
          {/* The hash is the evidence: if the file behind the contract is ever replaced, it
              will no longer match, and this record says which version was agreed to. */}
          <Text size="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
            {t('Document fingerprint {hash}', { hash: signature.documentSha256 })}
          </Text>
        </Box>
      ) : (
        <Text size="caption" color="text.secondary">
          {t('Link expires {when}', { when: formatDateTime(signature.expiresAt) })}
        </Text>
      )}
    </Box>
  );
}

/**
 * Every signature request on one contract, and what came back.
 *
 * This is the record an argument is settled from: who was asked, what they typed, when, from
 * where, and the fingerprint of the document they were shown.
 */
export function SignatureEvidence({ contractId }: Readonly<SignatureEvidenceProps>) {
  const t = useT();
  const notify = useNotify();
  const confirm = useConfirm();
  const { formatDateTime } = useSettings();
  const { data, loading, error, refetch } = useContractSignaturesQuery({
    variables: { contractId },
    fetchPolicy: 'cache-and-network',
  });
  const [revoke] = useRevokeContractSignatureMutation();
  const signatures = data?.contractSignatures ?? [];

  const withdraw = async (signature: Signature) => {
    const ok = await confirm({
      title: 'Withdraw this request?',
      message: 'The link sent to {name} stops working immediately.',
      messageValues: { name: signature.signerName },
      confirmText: 'Withdraw',
    });
    if (!ok) {
      return;
    }
    try {
      await revoke({ variables: { id: signature.id } });
      await refetch();
      notify(t('The request has been withdrawn.'), 'success');
    } catch (err) {
      notify(errorMessage(err, t('It could not be withdrawn.')), 'error');
    }
  };

  return (
    <Box>
      {loading && signatures.length === 0 && <LinearProgress sx={{ mb: 1 }} />}
      {error && <Alert severity="error">{errorMessage(error, t('Unavailable.'))}</Alert>}
      {!loading && signatures.length === 0 && (
        <Text size="sm" color="text.secondary">
          {t('Nobody has been asked to sign this yet.')}
        </Text>
      )}
      {signatures.map((signature) => (
        <SignatureRow
          key={signature.id}
          signature={signature}
          formatDateTime={formatDateTime}
          onWithdraw={withdraw}
        />
      ))}
    </Box>
  );
}
