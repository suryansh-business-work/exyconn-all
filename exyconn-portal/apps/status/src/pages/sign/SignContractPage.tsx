import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Flex,
  Typography,
  fontWeight,
} from '@exyconn/shell/components/ui';
import { useContractToSignQuery } from '@exyconn/shell/graphql/generated';
import { SignContractForm } from './forms/sign-contract';
import { SignedReceipt } from './SignedReceipt';
import { ContractFacts } from './ContractFacts';

/**
 * The page a counterparty signs on.
 *
 * No account, because they do not have one and should not need one: the link they were sent
 * is what identifies them, and it is the only thing that does. An unknown, withdrawn or
 * expired link is one message — saying which it was would tell somebody holding a guessed
 * link that they had guessed a real one.
 */
export function SignContractPage() {
  const t = useT();
  const navigate = useNavigate();
  const { token = '' } = useParams();
  const [signedHash, setSignedHash] = useState<string | null>(null);
  const { data, loading } = useContractToSignQuery({
    variables: { token },
    skip: !token,
    fetchPolicy: 'network-only',
  });
  const contract = data?.contractToSign;

  if (loading) {
    return (
      <Flex direction="column" alignItems="center" sx={{ py: 6 }}>
        <CircularProgress />
      </Flex>
    );
  }

  if (!contract) {
    return (
      <Card variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Typography variant="h6" sx={{ fontWeight: fontWeight.bold }}>
          {t('This link does not work')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          {t(
            'It may have been withdrawn, already used, or simply expired. Ask whoever sent it for a new one.',
          )}
        </Typography>
        <Button variant="text" sx={{ mt: 2 }} onClick={() => navigate('/')}>
          {t('Back to status')}
        </Button>
      </Card>
    );
  }

  if (signedHash !== null) {
    return <SignedReceipt contract={contract} documentSha256={signedHash} />;
  }

  if (contract.signedAt) {
    return (
      <Card variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
        <Alert severity="success">{t('This contract has already been signed.')}</Alert>
        <ContractFacts contract={contract} />
      </Card>
    );
  }

  return (
    <Flex direction="column" spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: fontWeight.bold }}>
          {t('Sign “{title}”', { title: contract.title })}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          {t('Sent to {name}. Read it, then sign below.', { name: contract.signerName })}
        </Typography>
      </Box>
      <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <ContractFacts contract={contract} />
      </Card>
      <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <SignContractForm
          token={token}
          contract={contract}
          onSigned={setSignedHash}
          onCancel={() => navigate('/')}
        />
      </Card>
    </Flex>
  );
}
