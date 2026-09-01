import React from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';
import { KeyOutlined, ArrowForward } from '@mui/icons-material';
import { useSecrets } from '../../context/SecretsContext';
import { secretsConfig } from '../SecretsDrawer/secretsConfig';

interface MissingKeyAlertProps {
  /** Secret key from secretsConfig, e.g. 'openai_api_key'. */
  secretKey: string;
  /** Optional override for the one-line hint. */
  hint?: string;
}

/**
 * Shown when a tool cannot run because a user-supplied API key is missing or
 * rejected. Rather than telling the user to go find the key icon, the button
 * opens the drawer with that exact field expanded and highlighted.
 */
const MissingKeyAlert: React.FC<Readonly<MissingKeyAlertProps>> = ({ secretKey, hint }) => {
  const { openSecrets } = useSecrets();
  const field = secretsConfig.find((item) => item.key === secretKey);
  const label = field?.label ?? 'API key';

  return (
    <Alert
      severity="warning"
      icon={<KeyOutlined fontSize="inherit" />}
      sx={{ alignItems: 'center' }}
      action={
        <Button
          size="small"
          variant="contained"
          color="warning"
          endIcon={<ArrowForward />}
          onClick={() => openSecrets(secretKey)}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Add key
        </Button>
      }
    >
      <AlertTitle sx={{ mb: 0.25 }}>{label} required</AlertTitle>
      <Box component="span" sx={{ fontSize: '0.875rem' }}>
        {hint ?? `This tool runs with your own ${label}. It stays in your browser and is never sent to Exyconn.`}
      </Box>
    </Alert>
  );
};

export default MissingKeyAlert;
