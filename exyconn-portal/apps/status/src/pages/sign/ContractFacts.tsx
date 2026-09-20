import DescriptionIcon from '@mui/icons-material/Description';
import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, Typography, fontWeight } from '@exyconn/shell/components/ui';
import { formatWith } from '@exyconn/shell/utils/date';
import { DATE_FORMAT } from '../../status.constants';
import type { ContractForSigning } from './forms/sign-contract';

/** What the contract says about itself, and the document itself. */
export function ContractFacts({ contract }: Readonly<{ contract: ContractForSigning }>) {
  const t = useT();
  const facts = [
    { label: t('Between'), value: contract.party },
    { label: t('Type'), value: contract.type },
    { label: t('Effective from'), value: formatWith(contract.effectiveDate, DATE_FORMAT) },
    { label: t('Expires'), value: formatWith(contract.expiryDate, DATE_FORMAT) },
  ];

  return (
    <Box>
      {facts.map((fact) => (
        <Flex key={fact.label} direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {fact.label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: fontWeight.semibold }}>
            {fact.value}
          </Typography>
        </Flex>
      ))}
      {contract.documentUrl && (
        <Button
          variant="outlined"
          startIcon={<DescriptionIcon />}
          href={contract.documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ mt: 1.5 }}
        >
          {t('Read the document')}
        </Button>
      )}
    </Box>
  );
}
