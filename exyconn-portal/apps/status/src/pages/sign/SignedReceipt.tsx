import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Card,
  Typography,
  fontSize,
  fontWeight,
  iconSize,
} from '@exyconn/shell/components/ui';
import type { ContractForSigning } from './forms/sign-contract';

interface SignedReceiptProps {
  contract: ContractForSigning;
  documentSha256: string;
}

/**
 * Confirmation, with the document's fingerprint.
 *
 * The hash is shown because it is the signer's half of the evidence: if the file behind that
 * link is ever replaced, the hash they were given no longer matches it, and they can say so.
 */
export function SignedReceipt({ contract, documentSha256 }: Readonly<SignedReceiptProps>) {
  const t = useT();
  const navigate = useNavigate();

  return (
    <Card variant="outlined" sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
      <CheckCircleIcon color="success" sx={{ fontSize: iconSize['5xl'] }} />
      <Typography variant="h5" sx={{ fontWeight: fontWeight.bold, mt: 1 }}>
        {t('Signed')}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
        {t('“{title}” is signed. A copy of this confirmation is worth keeping.', {
          title: contract.title,
        })}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
        {t('Fingerprint of the document you signed')}
      </Typography>
      <Box
        sx={{
          mt: 0.5,
          fontFamily: 'monospace',
          fontSize: fontSize.xs,
          wordBreak: 'break-all',
        }}
      >
        {documentSha256}
      </Box>
      <Button variant="text" sx={{ mt: 2 }} onClick={() => navigate('/')}>
        {t('Back to status')}
      </Button>
    </Card>
  );
}
